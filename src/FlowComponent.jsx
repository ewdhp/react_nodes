import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactFlow, { addEdge, Background, ReactFlowProvider, applyNodeChanges, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import MonacoEditor from "@monaco-editor/react";
import { useTerminalSocket } from "./TerminalProvider";
import { Terminal } from "./Terminal";

const nodeStyle = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  fontSize: "14px",
  border: "1px solid black",
};

const FlowComponent = () => {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useState([]);
  const reactFlowInstance = useRef(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [outputLog, setOutputLog] = useState([]);
  const { createTerminal, getTerminal } = useTerminalSocket();
  const [showLog, setShowLog] = useState(true);

  const executeFlow = useCallback((type, startNodeId) => {
    const nodeMap = new Map();
    edges.forEach((edge) => {
      if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, []);
      nodeMap.get(edge.source).push(edge.target);
    });

    const executeSequential = async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        await executeNode(node);
        for (const target of nodeMap.get(nodeId) || []) {
          await executeSequential(target);
        }
      }
    };

    const executeParallel = async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        await executeNode(node);
        await Promise.all((nodeMap.get(nodeId) || []).map((target) => executeParallel(target)));
      }
    };

    // Use the provided startNodeId or fallback to "1"
    const startId = startNodeId || "1";
    type === "sequential" ? executeSequential(startId) : executeParallel(startId);
  }, [edges, nodes]);
  // Create new node and terminal on ctrl+alt+n
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key === "n") {
        event.preventDefault();
        const position = { x: 100 + nodes.length * 40, y: 100 + nodes.length * 40 };
        const newId = `${+new Date()}`;
        const newNode = {
          id: newId,
          position,
          data: { label: `Node ${nodes.length + 1}`, mode: "parallel", script: "echo 'New Node Execution'" },
          draggable: true, sourcePosition: 'right',
          targetPosition: 'left',
          style: { ...nodeStyle },
        };

        setNodes((nds) => {
          setTimeout(() => {
            if (reactFlowInstance.current) {
              reactFlowInstance.current.setCenter(position.x, position.y, { zoom: 1.5, duration: 300 });
            }
          }, 0);
          return nds.concat(newNode);
        });

        createTerminal(newId); // Create a terminal for the new node
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, createTerminal]);

  // Toggle terminal/editor and run flow
  useEffect(() => {
    const handleKeyDown = (event) => {
      const firstSelectedNodeId = selectedNodes[0];
      const firstSelectedNode = nodes.find(n => n.id === firstSelectedNodeId);

      if (event.ctrlKey && event.altKey && event.key === "r") {
        event.preventDefault();
        // Only run if there is at least one selected node
        if (selectedNodes.length > 0) {
          // Use the first selected node's id as the starting point
          executeFlow("parallel", selectedNodes[0]);
        } else if (nodes.length > 0) {
          // Fallback: run from the first node if nothing is selected
          executeFlow("parallel", nodes[0].id);
        } else {
          console.log("No nodes to run.");
        }
      }

      if (event.ctrlKey && event.altKey && event.key === "c") {
        event.preventDefault();
        if (!firstSelectedNode) {
          console.log("No node selected! Select a node first.");
          return;
        }
        setShowEditor((prev) => !prev);
      }

      if (event.ctrlKey && event.altKey && event.key === "t") {
        event.preventDefault();
        if (!firstSelectedNode) {
          console.log("No node selected! Select a node first.");
          return;
        }
        setShowTerminal((prev) => !prev);
      }

      if (event.ctrlKey && event.altKey && event.key === "l") {
        event.preventDefault();
        setShowLog((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeFlow, selectedNodes, nodes]);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = (edgeToRemove) => {
    setEdges((eds) => eds.filter((edge) => edge.id !== edgeToRemove.id));
  };

  // Multi-select logic
  const onNodeClick = (event, node) => {
    setSelectedNodes((prev) => {
      // Ctrl or Shift for multi-select
      if (event.ctrlKey || event.metaKey || event.shiftKey) {
        if (prev.includes(node.id)) {
          // Deselect if already selected
          return prev.filter(id => id !== node.id);
        } else {
          // Add to selection
          return [...prev, node.id];
        }
      } else {
        // Single select
        return [node.id];
      }
    });
  };

  // Highlight selected nodes in blue
  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) =>
        selectedNodes.includes(n.id)
          ? { ...n, style: { ...n.style, border: "3px solid #2196f3" } }
          : { ...n, style: { ...n.style, border: "1px solid black" } }
      )
    );
  }, [selectedNodes, setNodes]);

  const executeNode = async (node) => {
    // Highlight node as running
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? {
            ...n,
            style: {
              ...n.style,
              border: "3px solid orange",
              animation: "pulse 1s infinite alternate",
            },
          }
          : n
      )
    );

    // Animate outgoing edges
    setEdges((eds) =>
      eds.map((e) =>
        e.source === node.id
          ? {
            ...e,
            animated: true,
            style: { ...e.style, stroke: "#2196f3", strokeWidth: 2 },
          }
          : e
      )
    );

    // Send Python script via SSH using python3 -c "<script>"
    const termObj = getTerminal(node.id);
    if (termObj && termObj.socket && node.data?.script) {
      const command = node.data.script || "";

      const handleMessage = (event) => {
        console.log("WS message received:", event);
        let lines = event.data.split('\n');
        // Remove echoed command if present
        if (lines[0].trim() === command.trim()) {
          lines = lines.slice(1);
        }
        const cleanedOutput = lines
          .filter(line =>
            !/^[\x1b\[\]0-9;]*[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+:.*\$ ?$/.test(line.trim())
          )
          .join('\n')
          .replace(/\x1b\[[0-9;]*m/g, '')
          .replace(/\x1b\][^\x07]*\x07/g, '');

        setOutputLog((prev) => [
          ...prev,
          {
            nodeId: node.id,
            output: cleanedOutput.trim(),
            time: new Date().toLocaleTimeString(),
          },
        ]);
      };
      termObj.socket.addEventListener("message", handleMessage, { once: true });

      termObj.socket.send(
        JSON.stringify({
          type: "command",
          command,
        })
      );
    }

    // Simulate execution time
    const executionTime = Math.floor(Math.random() * 2000) + 500;
    await new Promise((resolve) => setTimeout(resolve, executionTime));

    // Remove highlight from node
    setNodes((nds) =>
      nds.map((n) =>
        n.id === node.id
          ? {
            ...n,
            style: {
              ...n.style,
              border: "1px solid black",
              animation: "none",
            },
          }
          : n
      )
    );

    // Remove animation from outgoing edges
    setEdges((eds) =>
      eds.map((e) =>
        e.source === node.id
          ? {
            ...e,
            animated: false,
            style: { ...e.style, stroke: "#222", strokeWidth: 1 },
          }
          : e
      )
    );
  };
  // Deselect all on canvas click
  const handlePaneClick = () => {
    setSelectedNodes([]);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, border: "1px solid black" }
      }))
    );
  };

  // Use the first selected node for editor/terminal
  const firstSelectedNode = nodes.find(n => n.id === selectedNodes[0]);

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Graph on the left */}
      <div style={{
        flex: 1,
        minWidth: 0,
        position: "relative",
        height: "100vh",
        background: "#f8f8f8"
      }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onConnect={(params) =>
              setEdges((eds) =>
                addEdge(
                  {
                    ...params,
                    type: "straight",
                    sourcePosition: "right",
                    targetPosition: "left",
                  },
                  eds
                )
              )
            }
            onEdgesChange={onEdgesChange}
            onEdgeClick={(event, edge) => onEdgesChange(edge)}
            onNodeClick={onNodeClick}
            onPaneClick={handlePaneClick}
            fitView
            draggable
            onInit={(instance) => (reactFlowInstance.current = instance)}
          >
            <Background />
          </ReactFlow>
        </ReactFlowProvider>
        {showEditor && firstSelectedNode?.data?.script && (
          <div style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "64%",
            height: "78%",
            padding: "10px",
            border: "1px solid #ccc",
            boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
            background: "#fff",
            zIndex: 10,
          }}>
            <MonacoEditor
              height="100%"
              defaultLanguage="javascript"
              value={firstSelectedNode?.data?.script || ""}
              theme="vs-light"
              options={{
                minimap: { enabled: true },
                scrollbar: { vertical: "hidden", horizontal: "hidden" },
              }}
              onChange={(newValue) => {
                setNodes((nds) =>
                  nds.map((n) =>
                    n.id === firstSelectedNode.id
                      ? { ...n, data: { ...n.data, script: newValue } }
                      : n
                  )
                );
              }}
            />
          </div>
        )}
        {showTerminal && firstSelectedNode && (
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "#111",
            zIndex: 20,
            borderTop: "2px solid #333",
          }}>
            <Terminal terminalId={firstSelectedNode.id} />
          </div>
        )}
      </div>
      {/* Logs on the right */}
      {showLog && (
        <div style={{
          position: "relative",
          width: "32vw",
          height: "97%",
          background: "#222",
          color: "#fff",
          overflowY: "auto",
          padding: "1em",
          fontFamily: "monospace"
        }}>
          <h4>SSH Output</h4>
          {outputLog.map((entry, idx) => (
            <div key={idx}>
              <b>Node {entry.nodeId}</b>
              <span style={{ float: "right", color: "#aaa" }}>{entry.time}</span>
              <pre style={{ whiteSpace: "pre-wrap" }}>{entry.output}</pre>
              <hr />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowComponent;