import React, { useEffect, useRef, useState, useCallback } from "react";
import ReactFlow, { addEdge, Background, ReactFlowProvider, applyNodeChanges, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import MonacoEditor from "@monaco-editor/react";
import { useTerminalSocket } from "./TerminalProvider";
import { Terminal } from "./Terminal";
import { FaRedo } from "react-icons/fa"; // <-- Install with: npm install react-icons

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
  const [runCount, setRunCount] = useState(0);
  const [currentRun, setCurrentRun] = useState(0);
  const [collapsedRuns, setCollapsedRuns] = useState({});
  const [runExecutions, setRunExecutions] = useState({}); // For replay
  const [renamingNodeId, setRenamingNodeId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  // Helper to check if there are any connected edges (for a new run)
  const hasConnectedEdges = () => edges && edges.length > 0;
  const handleNodeDoubleClick = (event, node) => {
    if (event.button === 0) { // Left double click
      setNodes((nds) => nds.filter((n) => n.id !== node.id));
      setSelectedNodes((prev) => prev.filter(id => id !== node.id));
    }
  };
  const handleNodeContextMenu = (event, node) => {
    event.preventDefault();
    setRenamingNodeId(node.id);
    setRenameValue(node.data.label || "");
  };

  const handleRenameInputChange = (e) => setRenameValue(e.target.value);

  const handleRenameInputKeyDown = (e, nodeId) => {
    if (e.key === "Enter") {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, label: renameValue } } : n
        )
      );
      setRenamingNodeId(null);
    }
    if (e.key === "Escape") {
      setRenamingNodeId(null);
    }
  };
  // Custom node renderer
  const renderNode = (node) => (
    <div
      style={{
        ...nodeStyle,
        background: "#fff",
        border: node.style?.border || "1px solid black",
        position: "relative",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
      onDoubleClick={(e) => handleNodeDoubleClick(e, node)}
      onContextMenu={(e) => handleNodeContextMenu(e, node)}
      title="Double left click to delete. Right click to rename."
    >
      {renamingNodeId === node.id ? (
        <input
          autoFocus
          value={renameValue}
          onChange={handleRenameInputChange}
          onKeyDown={(e) => handleRenameInputKeyDown(e, node.id)}
          onBlur={() => setRenamingNodeId(null)}
          style={{
            width: "70px",
            fontSize: 14,
            borderRadius: 4,
            border: "1px solid #888",
            padding: "2px 6px",
            textAlign: "center"
          }}
        />
      ) : (
        <span>{node.data.label}</span>
      )}
    </div>
  );
  const executeFlow = useCallback((type, startNodeId) => {
    // Increment run counter for each new flow execution
    setRunCount((prev) => prev + 1);
    setCurrentRun((prev) => prev + 1);

    // Save a snapshot of the nodes and edges for this run
    setRunExecutions(prev => ({
      ...prev,
      [currentRun + 1]: {
        startNodeId,
        type,
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      }
    }));

    const nodeMap = new Map();
    edges.forEach((edge) => {
      if (!nodeMap.has(edge.source)) nodeMap.set(edge.source, []);
      nodeMap.get(edge.source).push(edge.target);
    });

    const executeSequential = async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        await executeNode(node, currentRun + 1);
        for (const target of nodeMap.get(nodeId) || []) {
          await executeSequential(target);
        }
      }
    };

    const executeParallel = async (nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        await executeNode(node, currentRun + 1);
        await Promise.all((nodeMap.get(nodeId) || []).map((target) => executeParallel(target)));
      }
    };

    // Use the provided startNodeId or fallback to "1"
    const startId = startNodeId || "1";
    type === "sequential" ? executeSequential(startId) : executeParallel(startId);
  }, [edges, nodes, currentRun]);

  // Replay logic
  const replayRun = (runId) => {
    const exec = runExecutions[runId];
    if (!exec) return;
    setNodes(exec.nodes);
    setEdges(exec.edges);
    executeFlow(exec.type, exec.startNodeId);
  };

  // Create new node and terminal on ctrl+alt+n
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.altKey && event.key === "n") {
        console.log("Creating new node");
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

  const executeNode = async (node, runId = currentRun) => {
    // Always show the log pane when executing a node
    setShowLog(true);

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
            run: runId,
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
            onNodeContextMenu={handleNodeContextMenu} // <-- Add this line for right-click rename
            onPaneClick={handlePaneClick}
            fitView
            draggable
            onInit={(instance) => (reactFlowInstance.current = instance)}
          >
            <Background />
          </ReactFlow>
          {/* Overlay input for renaming */}
          {renamingNodeId && (() => {
            const node = nodes.find(n => n.id === renamingNodeId);
            if (!node) return null;
            const { x, y } = node.position;
            return (
              <input
                autoFocus
                value={renameValue}
                onChange={handleRenameInputChange}
                onKeyDown={(e) => handleRenameInputKeyDown(e, node.id)}
                onBlur={() => setRenamingNodeId(null)}
                style={{
                  position: "absolute",
                  left: x + 10, // adjust for centering
                  top: y + 30,  // adjust for centering
                  width: "70px",
                  fontSize: 14,
                  borderRadius: 4,
                  border: "1px solid #888",
                  padding: "2px 6px",
                  textAlign: "center",
                  background: "#fff",
                  zIndex: 100,
                  pointerEvents: "auto"
                }}
              />
            );
          })()}
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
      {showLog && (
        <div style={{
          position: "relative",
          width: "27vw",
          height: "97%",
          background: "#222",
          color: "#fff",
          overflowY: "auto",
          padding: "1em",
          fontFamily: "monospace"
        }}>
          <h4>SSH Output</h4>
          <div style={{ marginBottom: 8, color: "#aaa" }}>Total Runs: {runCount}</div>
          {/* Group log entries by run */}
          {Array.from(
            outputLog.reduce((acc, entry) => {
              if (!acc.has(entry.run)) acc.set(entry.run, []);
              acc.get(entry.run).push(entry);
              return acc;
            }, new Map())
          ).map(([run, entries]) => (
            <div key={run} style={{ marginBottom: 8 }}>
              <div
                style={{
                  background: "#333",
                  color: "#fff",
                  padding: "4px 8px",
                  borderRadius: 4,
                  marginBottom: 4,
                  fontWeight: "bold",
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: 32
                }}
                onClick={() =>
                  setCollapsedRuns(prev => ({
                    ...prev,
                    [run]: !prev[run]
                  }))
                }
              >
                <span>
                  {collapsedRuns[run] ? "▶" : "▼"} Run #{run}
                </span>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    color: "#4fc3f7",
                    cursor: "pointer",
                    marginLeft: 12,
                    fontSize: 15,
                    display: "flex",
                    alignItems: "center",
                    padding: 0
                  }}
                  title="Replay this run"
                  onClick={e => {
                    e.stopPropagation();
                    replayRun(run);
                  }}
                >
                  <FaRedo />
                </button>
              </div>
              {!collapsedRuns[run] && entries.map((entry, idx) => (
                <div key={idx}>
                  <b>
                    Node {nodes.find(n => n.id === entry.nodeId)?.data?.label || entry.nodeId}
                  </b>
                  <span style={{ float: "right", color: "#aaa" }}>
                    {entry.time}
                  </span>
                  <pre style={{ whiteSpace: "pre-wrap" }}>{entry.output}</pre>
                  <hr />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowComponent;