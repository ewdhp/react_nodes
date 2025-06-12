import React, { useCallback, useState, useEffect, useRef, useMemo } from "react";
import ReactFlow, { Controls, Background, applyNodeChanges } from "reactflow";
import NodeTypeMenu from "./NodeTypeMenu";
import "reactflow/dist/style.css";
import Node from "./Node";
import { NodeUpdateContext } from "./NodeUpdateContext";
import LogPane from "./LogPane";
import TerminalTabs from './Terminal'; // adjust path if needed
import * as GraphStructures from "./GraphStructures";

const initialNodes = [
];
const initialEdges = [];


// --- Node wrapper to highlight selected nodes ---
const HighlightNode = (props) => {
  // props.selected is provided by React Flow
  return (
    <div
      style={{
        border: props.selected ? '2px solid #2196f3' : undefined,
        borderRadius: 6,
        boxSizing: 'border-box',
        background: '#fff',
        // Prevent text selection on drag/select
        userSelect: 'none',
        MozUserSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      <Node {...props} />
    </div>
  );
};

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
  const [showStructureMenu, setShowStructureMenu] = useState(false);
  const [structureMenuIndex, setStructureMenuIndex] = useState(0);
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
    base: HighlightNode,
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
      // Copy selected nodes: Ctrl+Shift+C
      if (
        e.ctrlKey &&
        e.shiftKey &&
        e.key.toLowerCase() === "c" &&
        selectedNodes.length > 0
      ) {
        e.preventDefault();
        // Deselect original nodes
        setNodes(nds =>
          nds.map(n => ({
            ...n,
            selected: false,
          }))
        );
        // Copy nodes
        setNodes(nds => {
          const selected = nds.filter(n => selectedNodes.includes(n.id));
          const idMap = {};
          const timestamp = Date.now();
          // Create new nodes with new IDs and offset positions
          const newNodes = selected.map((n, idx) => {
            const newId = `${n.id}-copy-${timestamp}-${idx}`;
            idMap[n.id] = newId;
            return {
              ...n,
              id: newId,
              position: {
                x: (n.position?.x || 0) + 40,
                y: (n.position?.y || 0) + 40,
              },
              selected: true,
            };
          });
          // Copy edges between selected nodes
          const selectedEdges = edges.filter(
            e =>
              selectedNodes.includes(e.source) &&
              selectedNodes.includes(e.target)
          );
          setEdges(eds => [
            ...eds,
            ...selectedEdges.map((e, idx) => ({
              ...e,
              id: `${e.id}-copy-${timestamp}-${idx}`,
              source: idMap[e.source],
              target: idMap[e.target],
            })),
          ]);
          // Select new nodes
          setSelectedNodes(newNodes.map(n => n.id));
          return [...nds, ...newNodes];
        });
        return;
      }
      // Toggle structure navbar: Ctrl+Alt+M
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "m") {
        e.preventDefault();
        setShowStructureMenu((v) => !v);
        setStructureMenuIndex(0);
        return;
      }

      // Structure menu navigation
      if (showStructureMenu) {
        const structureKeys = Object.keys(GraphStructures);
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setStructureMenuIndex(i => (i + 1) % structureKeys.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setStructureMenuIndex(i => (i - 1 + structureKeys.length) % structureKeys.length);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const key = structureKeys[structureMenuIndex];
          if (key && GraphStructures[key]) {
            const newIds = GraphStructures[key]({
              setNodes,
              setEdges,
              nodes,
              edges,
            });
            setTimeout(() => selectNodesByIds(newIds), 0);
            setShowStructureMenu(false);
          }
          return;
        }
        if (e.key === "Escape") {
          setShowStructureMenu(false);
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    nodes, edges, selectedNodes, history, future, loadGraphFromFile,
    showStructureMenu, structureMenuIndex
  ]);

  // --- Mouse: multi-select, deselect, inline rename ---
  // Use this callback for both click and rectangle selection to keep logic consistent
  const selectNodesByIds = useCallback((ids) => {
    setNodes(nds =>
      nds.map(n => ({
        ...n,
        selected: ids.includes(n.id),
      }))
    );
    setSelectedNodes(ids);
  }, []);

  const onNodeClick = useCallback((event, node) => {
    let newSelected;
    if (event.ctrlKey || event.metaKey || event.shiftKey) {
      newSelected = selectedNodes.includes(node.id)
        ? selectedNodes.filter(id => id !== node.id)
        : [...selectedNodes, node.id];
    } else {
      newSelected = [node.id];
    }
    selectNodesByIds(newSelected);
  }, [selectedNodes, selectNodesByIds]);

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

  // Rectangle selection state
  const [selectionRect, setSelectionRect] = useState(null);
  const selectionStart = useRef(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Mouse move: update rectangle
  const handlePaneMouseMove = useCallback((e) => {
    if (!selectionStart.current) return;
    const pane = document.querySelector('.react-flow__pane');
    if (!pane) return;
    // Prevent text selection while dragging
    window.getSelection()?.removeAllRanges();
    const rect = pane.getBoundingClientRect();
    const startX = selectionStart.current.x;
    const startY = selectionStart.current.y;
    const currX = e.clientX - rect.left;
    const currY = e.clientY - rect.top;
    setSelectionRect({
      x: Math.min(startX, currX),
      y: Math.min(startY, currY),
      width: Math.abs(currX - startX),
      height: Math.abs(currY - startY),
    });
  }, []);

  // Mouse up: select nodes in rectangle and stop growing rectangle
  const handlePaneMouseUp = useCallback((e) => {
    // Cache the current selectionRect before clearing it
    let rect = selectionRect;
    if (!rect) {
      // Try to get the rectangle from the event if selectionRect is null
      const pane = document.querySelector('.react-flow__pane');
      if (pane && selectionStart.current) {
        const paneRect = pane.getBoundingClientRect();
        const currX = e.clientX - paneRect.left;
        const currY = e.clientY - paneRect.top;
        rect = {
          x: Math.min(selectionStart.current.x, currX),
          y: Math.min(selectionStart.current.y, currY),
          width: Math.abs(currX - selectionStart.current.x),
          height: Math.abs(currY - selectionStart.current.y),
        };
      }
    }
    setSelectionRect(null);
    setIsSelecting(false);
    selectionStart.current = null;
    window.removeEventListener('mousemove', handlePaneMouseMove);
    window.removeEventListener('mouseup', handlePaneMouseUp);
    document.body.style.cursor = '';
    // Find nodes inside rectangle and select them
    if (rect) {
      const selected = nodes.filter(n => {
        const nodeWidth = n.width || 40;
        const nodeHeight = n.height || 40;
        const nodeLeft = n.position.x;
        const nodeRight = n.position.x + nodeWidth;
        const nodeTop = n.position.y;
        const nodeBottom = n.position.y + nodeHeight;
        const rectLeft = rect.x;
        const rectRight = rect.x + rect.width;
        const rectTop = rect.y;
        const rectBottom = rect.y + rect.height;
        return (
          nodeLeft < rectRight &&
          nodeRight > rectLeft &&
          nodeTop < rectBottom &&
          nodeBottom > rectTop
        );
      });
      const selectedIds = selected.map(n => n.id);
      // Update selected property for all nodes
      setNodes(nds =>
        nds.map(n => ({
          ...n,
          selected: selectedIds.includes(n.id),
        }))
      );
      setSelectedNodes(selectedIds);
      console.log(`Selected nodes: ${selectedIds.join(', ')}`);
    }
  }, [nodes, selectionRect, handlePaneMouseMove]);

  // Mouse down on pane: start rectangle selection (only if Ctrl is pressed)
  const handlePaneMouseDown = useCallback((e) => {
    // Only left mouse button, Ctrl must be held, and not on input/textarea
    if (
      e.button === 0 &&
      e.ctrlKey &&
      e.target.classList.contains('react-flow__pane') &&
      e.target.tagName !== 'INPUT' &&
      e.target.tagName !== 'TEXTAREA'
    ) {
      const rect = e.target.getBoundingClientRect();
      selectionStart.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
      setSelectionRect({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: 0,
        height: 0,
      });
      setIsSelecting(true);
      document.body.style.cursor = 'default';
      window.addEventListener('mousemove', handlePaneMouseMove);
      window.addEventListener('mouseup', handlePaneMouseUp);
      // Prevent text selection on drag start
      window.getSelection()?.removeAllRanges();
    }
  }, [handlePaneMouseMove, handlePaneMouseUp]);

  // Reset cursor if selection is cancelled
  useEffect(() => {
    if (!isSelecting) {
      document.body.style.cursor = '';
    }
  }, [isSelecting]);


  // Handles node drag for multi-selection (improve smoothness)
  const handleNodeDrag = useCallback((event, node) => {
    // Only allow dragging if this node is selected
    if (!selectedNodes.includes(node.id)) {
      event.preventDefault?.();
      return;
    }
    // Use the delta from React Flow's node drag event if available
    // event.delta is available in React Flow >=11, fallback to movementX/Y
    const deltaX = event?.delta?.x ?? event.movementX ?? 0;
    const deltaY = event?.delta?.y ?? event.movementY ?? 0;
    if (deltaX === 0 && deltaY === 0) return;
    setNodes(nds =>
      nds.map(n =>
        selectedNodes.includes(n.id)
          ? {
            ...n,
            position: {
              x: (n.position?.x || 0) + deltaX,
              y: (n.position?.y || 0) + deltaY,
            },
          }
          : n
      )
    );
  }, [selectedNodes, setNodes]);

  // Make only selected nodes draggable
  const nodeDraggable = useCallback((node) => selectedNodes.includes(node.id), [selectedNodes]);

  return (
    <NodeUpdateContext.Provider value={onNodeUpdate}>
      <div style={{ display: "flex", height: "100vh" }}>
        {/* Graph on the left */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            position: "relative",
            height: "100vh",
            background: "#f8f8f8",
            overflow: "hidden",
            cursor: isSelecting ? 'default' : undefined
          }}
          onMouseDown={handlePaneMouseDown}
        >
          {/* Structure navbar */}
          {showStructureMenu && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 320,
                height: "100%",
                background: "#fff",
                borderRight: "1px solid #ddd",
                zIndex: 3000,
                boxShadow: "2px 0 12px #0001",
                padding: 0,
                display: "flex",
                flexDirection: "column"
              }}
            >
              <div style={{
                fontWeight: "bold",
                fontSize: 20,
                padding: "18px 24px 8px 24px",
                borderBottom: "1px solid #eee"
              }}>
                Graph Structures
              </div>
              <ul style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                flex: 1,
                overflowY: "auto"
              }}>
                {Object.keys(GraphStructures).map((key, idx) => (
                  <li
                    key={key}
                    style={{
                      padding: "14px 28px",
                      background: idx === structureMenuIndex ? "#e3f2fd" : undefined,
                      color: idx === structureMenuIndex ? "#1976d2" : "#222",
                      fontWeight: idx === structureMenuIndex ? "bold" : "normal",
                      cursor: "pointer"
                    }}
                    onMouseEnter={() => setStructureMenuIndex(idx)}
                    onClick={() => {
                      const newIds = GraphStructures[key]({ setNodes, setEdges, nodes, edges });
                      setTimeout(() => selectNodesByIds(newIds), 0);
                      setShowStructureMenu(false);
                    }}
                  >
                    {key}
                  </li>
                ))}
              </ul>
              <div style={{
                fontSize: 13,
                color: "#888",
                padding: "10px 24px 18px 24px",
                borderTop: "1px solid #eee"
              }}>
                <div><b>↑/↓</b>: Navigate</div>
                <div><b>Enter</b>: Insert structure</div>
                <div><b>Esc</b>: Close</div>
                <div><b>Ctrl+Alt+M</b>: Toggle menu</div>
              </div>
            </div>
          )}
          {/* Rectangle selection overlay */}
          {selectionRect && (
            <div
              style={{
                position: 'absolute',
                left: selectionRect.x,
                top: selectionRect.y,
                width: selectionRect.width,
                height: selectionRect.height,
                border: '2px dashed #00bcd4',
                background: 'rgba(0,188,212,0.08)',
                zIndex: 2000,
                pointerEvents: 'none',
              }}
            />
          )}
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
            fitView
            onNodeDrag={handleNodeDrag}
          >
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
                <li><b>Ctrl + Alt + M</b>: Toggle structure menu</li>
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

// selectedNodes is a state array of node IDs that are currently selected.
// It is used for:
// - Highlighting nodes with a blue border (via HighlightNode and React Flow's selected prop)
// - Enabling multi-select (Ctrl/Shift + click or rectangle selection)
// - Restricting dragging: only nodes in selectedNodes can be dragged together
// - Deleting: pressing Delete removes all nodes in selectedNodes
// - Deselecting: pressing Escape or clicking the pane clears selectedNodes
// - Rectangle selection: after selection, all nodes under the rectangle are added to selectedNodes