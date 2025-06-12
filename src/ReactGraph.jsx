import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import ReactFlow, { Controls, Background, applyNodeChanges } from "reactflow";
import NodeTypeMenu from "./NodeTypeMenu";
import "reactflow/dist/style.css";
import Node from "./Node";
import { NodeUpdateContext } from "./NodeUpdateContext";
import LogPane from "./LogPane";
import TerminalTabs from './Terminal'; // adjust path if needed

const initialNodes = [
];
const initialEdges = [];

export default function ReactGraph() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [showNodeTypeMenu, setShowNodeTypeMenu] = useState(false);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [showLog, setShowLog] = useState(true); // Show LogPane by default
  const [runCount, setRunCount] = useState(0);
  const [outputLog, setOutputLog] = useState([]);
  const [runExecutions, setRunExecutions] = useState({});
  const [collapsedRuns, setCollapsedRuns] = useState({});
  const [showTerminal, setShowTerminal] = useState(false);
  const reactFlowInstance = useRef(null);

  // Ctrl + Alt + N to open NodeTypeMenu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.altKey &&
        e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowNodeTypeMenu(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener
      ("keydown", handleKeyDown);
  }, []);

  // Toggle LogPane visibility with Ctrl+Alt+L
  useEffect(() => {
    const handleLogPaneToggle = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setShowLog((v) => !v);
      }
    };
    window.addEventListener("keydown", handleLogPaneToggle);
    return () => window.removeEventListener("keydown", handleLogPaneToggle);
  }, []);

  // Toggle TerminalTabs visibility with Ctrl+Alt+T
  useEffect(() => {
    const handleTerminalToggle = (e) => {
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleTerminalToggle);
    return () => window.removeEventListener('keydown', handleTerminalToggle);
  }, []);

  // Callback to update node data
  const onNodeUpdate = useCallback(
    (id, newData) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id
            ? {
              ...n,
              data: {
                ...n.data,
                ...newData,
              },
            }
            : n
        )
      );
    },
    [setNodes]
  );
  // --- nodeTypes with context pattern ---
  const nodeTypes = useMemo(() => ({
    base: Node,
  }), []);

  // Callback for NodeTypeMenu to add a new node
  const handleAddNodeOfType = (typeKey) => {
    const newId = `${+new Date()}`;
    let position = { x: 0, y: 0 };
    if (reactFlowInstance.current) {
      const container = document.querySelector('.react-flow');
      const logPane = document.querySelector('.log-pane-root');
      let logPaneWidth = 0;
      if (logPane && logPane.offsetWidth) {
        logPaneWidth = logPane.offsetWidth;
      }
      if (container) {
        const rect = container.getBoundingClientRect();
        let x = rect.width / 2;
        let y = rect.height / 2;
        // Subtract half the log pane width from the x position
        x = x - logPaneWidth / 2;
        position = { x, y };
      }
    }
    const newNode = {
      id: newId,
      position,
      type: typeKey,
      data: {
        label: `${typeKey.charAt(0).toUpperCase() +
          typeKey.slice(1)} ${nodes.length + 1}`
      },
    };
    setNodes((nds) => nds.concat(newNode));
    setShowNodeTypeMenu(false);
  };

  // Handles node movement
  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  // Handles edge updates
  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => eds.map((e) => ({ ...e, ...changes }))),
    []
  );
  // Creates a new edge when connecting nodes
  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => [
        ...eds,
        {
          ...connection,
          id: `${connection.source}-${connection.target}`,
          animated: true,
        },
      ]);
    },
    []
  );
  // Removes edge when clicked
  const onEdgeClick = useCallback(
    (event, edge) => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    },
    []
  );

  // --- Hotkeys and mouse features ---
  // 1. Delete selected node(s) with Delete/Backspace
  // 2. Delete edge with Delete/Backspace when selected
  // 3. Multi-select nodes with Ctrl/Shift + click
  // 4. Deselect all with Escape or canvas click
  // 5. Undo/Redo (Ctrl+Z/Ctrl+Y)
  // 6. Edit node label inline (double-click)
  // 7. Keyboard navigation (arrow keys)
  // 8. Save/Load (Ctrl+S/Ctrl+O)

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Load graph from file (Ctrl+O or call directly)
  const loadGraphFromFile = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const { nodes: n, edges: egs } = JSON.parse(e.target.result);
          setNodes(n);
          setEdges(egs);
        } catch (err) {
          alert("Invalid graph file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // --- Hotkey handler ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Node creation
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setShowNodeTypeMenu(true);
        return;
      }
      // Undo
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (history.length > 0) {
          setFuture(f => [{ nodes, edges }, ...f]);
          const prev = history[history.length - 1];
          setNodes(prev.nodes);
          setEdges(prev.edges);
          setHistory(h => h.slice(0, -1));
        }
        return;
      }
      // Redo
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (future.length > 0) {
          setHistory(h => [...h, { nodes, edges }]);
          const next = future[0];
          setNodes(next.nodes);
          setEdges(next.edges);
          setFuture(f => f.slice(1));
        }
        return;
      }
      // Save
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const data = JSON.stringify({ nodes, edges });
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `graph-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
      // Load
      if (e.ctrlKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        loadGraphFromFile();
        return;
      }
      // Delete selected nodes/edges
      if (e.key === "Delete" && selectedNodes.length > 0) {
        e.preventDefault();
        setHistory(h => [...h, { nodes, edges }]);
        setNodes(nds => nds.filter(n => !selectedNodes.includes(n.id)));
        setEdges(eds => eds.filter(e => !selectedNodes.includes(e.source) &&
          !selectedNodes.includes(e.target)));
        setSelectedNodes([]);
        return;
      }
      // Deselect all
      if (e.key === "Escape") {
        setSelectedNodes([]);
        return;
      }
      // Show hotkeys modal: Ctrl + Alt + H
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "h") {
        e.preventDefault();
        setShowHotkeys((v) => !v);
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges, selectedNodes, history, future, loadGraphFromFile]);

  // --- Mouse: multi-select, deselect, inline rename ---
  const onNodeClick = useCallback((event, node) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      setSelectedNodes(prev => prev.includes(node.id)
        ? prev.filter(id => id !== node.id)
        : [...prev, node.id]);
    } else {
      setSelectedNodes([node.id]);
    }
  }, []);

  // --- Right-click to rename node ---
  // Remove renaming logic from here, now handled in Node component
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    // No-op: Node handles its own renaming
  }, []);


  const onPaneClick = useCallback(() => {
    setSelectedNodes([]);
  }, []);

  // Example replayRun function (implement as needed)
  const replayRun = (runId) => {
    // ...existing code or leave as a stub...
  };

  // Add this function to generate a star/circle graph
  const generateCircleGraph = useCallback(() => {
    const centerX = 400;
    const centerY = 400;
    const radius = 250;
    const nodeCount = 10;
    const newNodes = [];
    const newEdges = [];

    // Generate unique IDs to avoid collision
    const timestamp = Date.now();
    const centerId = `center-${timestamp}`;

    // Center node
    newNodes.push({
      id: centerId,
      position: { x: centerX, y: centerY },
      type: 'base',
      data: { label: 'Center' },
    });

    // Peripheral nodes and edges
    for (let i = 0; i < nodeCount; i++) {
      const angle = (2 * Math.PI * i) / nodeCount;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      const nodeId = `node${i + 1}-${timestamp}`;
      newNodes.push({
        id: nodeId,
        position: { x, y },
        type: 'base',
        data: { label: `Node ${i + 1}` },
      });
      newEdges.push({
        id: `${centerId}-${nodeId}`,
        source: centerId,
        target: nodeId,
        animated: true,
      });
    }

    setNodes(prev => [...prev, ...newNodes]);
    setEdges(prev => [...prev, ...newEdges]);
  }, [setNodes, setEdges]);

  return (
    <NodeUpdateContext.Provider value={onNodeUpdate}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Graph on the left */}
        <div style={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          height: "100vh",
          background: "#f8f8f8",
          overflow: "hidden",
        }}>
          {/* Add a button to generate the circle/star graph */}
          <button
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              zIndex: 1001,
              padding: "8px 16px",
              borderRadius: 4,
              border: "none",
              background: "#00bcd4",
              color: "#fff",
              fontWeight: "bold",
              cursor: "pointer"
            }}
            onClick={generateCircleGraph}
          >
            Generate Circle Graph
          </button>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onNodeContextMenu={onNodeContextMenu}
            onInit={(instance) => (reactFlowInstance.current = instance)}
            fitView>
            <Controls />
            <Background color="#f0f0f0" gap={20} />
          </ReactFlow>
          {/* Node type selection menu */}
          {showNodeTypeMenu && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                display: "flex",
                alignItems: "center",
                // justifyContent: "center", // Remove this
                zIndex: 2001,
                background: "rgba(0,0,0,0.15)",
                // Shift overlay left by log pane width if present
                right: (document.querySelector('.log-pane-root')?.offsetWidth || 0),
                width: `calc(100vw - ${(document.querySelector('.log-pane-root')?.offsetWidth || 0)}px)`
              }}
            >
              <div
                style={{
                  position: "fixed",
                  top: "16%",
                  left: "14%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2002,
                }}
              >
                <NodeTypeMenu
                  nodeTypes={nodeTypes}
                  open={showNodeTypeMenu}
                  onSelect={handleAddNodeOfType}
                  onCancel={() => setShowNodeTypeMenu(false)}
                />
              </div>
            </div>
          )}
          {/* Hotkeys overlay */}
          {showHotkeys && (
            <div
              style={{
                position: "fixed",
                top: 24,
                right: 24,
                zIndex: 2000,
                pointerEvents: "auto",
                background: "rgba(255,255,255,0.85)",
                borderRadius: 8,
                padding: 32,
                minWidth: 340,
                boxShadow: "0 2px 16px #0002",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
              }}
              onClick={() => setShowHotkeys(false)}
            >
              <h2 style={{ marginTop: 0 }}>
                Keyboard Shortcuts</h2>
              <ul style={{
                lineHeight: 1.8,
                fontSize: 16,
                margin: 0,
                padding: 0,
                listStyle: 'none'
              }}>
                <li><b>Ctrl + Alt + N</b>: New node menu</li>
                <li><b>Delete</b>: Delete selected node(s)</li>
                <li><b>Ctrl/Shift + Click</b>: Multi-select</li>
                <li><b>Escape</b>: Deselect all</li>
                <li><b>Double-click node</b>: Rename node</li>
                <li><b>Ctrl + Z</b>: Undo</li>
                <li><b>Ctrl + Y</b>: Redo</li>
                <li><b>Ctrl + S</b>: Save graph</li>
                <li><b>Ctrl + O</b>: Load graph</li>
                <li><b>Ctrl + Alt + H</b>: Show/hide</li>
              </ul>
            </div>
          )}
          {/* Terminal tabs overlay */}
          {showTerminal && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                background: 'rgba(20,20,20,0.97)',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <TerminalTabs />
            </div>
          )}
        </div>
        {/* LogPane on the right */}
        <LogPane
          showLog={showLog}
          runCount={runCount}
          outputLog={outputLog}
          runExecutions={runExecutions}
          collapsedRuns={collapsedRuns}
          setCollapsedRuns={setCollapsedRuns}
          replayRun={replayRun}
        />
      </div>
    </NodeUpdateContext.Provider>
  );
}