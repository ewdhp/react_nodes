import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import ReactFlow, { addEdge, Background, ReactFlowProvider, applyNodeChanges, useNodesState } from "reactflow";
import "reactflow/dist/style.css";
import { useTerminalSocket } from "./TerminalProvider";
import { Terminal } from "./Terminal";
import { FaRedo } from "react-icons/fa"; // <-- Install with: npm install react-icons
import Prompt from "./Prompt";
import MonacoEditor from "./MonacoEditor";
import AIAPISelector from "./AIAPISelector";
import CustomNode from "./CustomNode";
import NodeTypeMenu from './NodeTypeMenu';
import LogPane from './LogPane';
import MiniTerminal from "./MiniTerminal";

const FlowComponent = () => {
    // --- State for nodes, edges, and React Flow instance ---
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useState([]);
    const reactFlowInstance = useRef(null);

    // --- State for editor, terminal, and log visibility ---
    const [showEditor, setShowEditor] = useState(false);
    const [showTerminal, setShowTerminal] = useState(false);
    const [showLog, setShowLog] = useState(false);

    // --- State for selected nodes and output log ---
    const [selectedNodes, setSelectedNodes] = useState([]);
    const [outputLog, setOutputLog] = useState([]);

    // --- State for run executions, renaming, node type menu, and new node position ---
    // runExecutions: stores snapshots of nodes/edges for replay
    // renamingNodeId/renameValue: for inline node renaming
    // showNodeTypeMenu/newNodePosition: for node creation UI
    const [runExecutions, setRunExecutions] = useState({}); // For replay
    const [renamingNodeId, setRenamingNodeId] = useState(null);
    const [renameValue, setRenameValue] = useState("");
    const [showNodeTypeMenu, setShowNodeTypeMenu] = useState(false);
    const [newNodePosition, setNewNodePosition] = useState({ x: 0, y: 0 });

    const { createTerminal, getTerminal } = useTerminalSocket();
    const [runCount, setRunCount] = useState(0);
    const [currentRun, setCurrentRun] = useState(0);
    const [collapsedRuns, setCollapsedRuns] = useState({});

    // --- Utility: Check if there are any connected edges ---
    // Returns true if there is at least one edge in the graph
    const hasConnectedEdges = () => edges && edges.length > 0;

    // --- Node double click handler ---
    // Removes the node from the graph on double click (left button)
    const handleNodeDoubleClick = (event, node) => {
        if (event.button === 0) { // Left double click
            setNodes((nds) => nds.filter((n) => n.id !== node.id));
            setSelectedNodes((prev) => prev.filter(id => id !== node.id));
        }
    };

    // --- Node context menu handler ---
    // Opens inline renaming input for the node
    const handleNodeContextMenu = (event, node) => {
        event.preventDefault();
        setRenamingNodeId(node.id);
        setRenameValue(node.data.label || "");
    };

    // --- Rename input change handler ---
    // Updates the rename input value as the user types
    const handleRenameInputChange = (e) => setRenameValue(e.target.value);

    // --- Rename input keydown handler ---
    // Commits or cancels renaming on Enter/Escape
    const handleRenameInputKeyDown = (e, nodeId) => {
        if (e.key === "Enter") {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId ? {
                        ...n, data:
                            { ...n.data, label: renameValue }
                    } : n
                )
            );
            setRenamingNodeId(null);
        }
        if (e.key === "Escape") {
            setRenamingNodeId(null);
        }
    };

    // --- Flow execution handler ---
    // Executes the graph from a start node, sequentially or in parallel
    // - Increments run counters
    // - Saves a snapshot of the graph for replay
    // - Recursively executes nodes and their children
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
                await Promise.all((nodeMap.get(nodeId) || [])
                    .map((target) => executeParallel(target)));
            }
        };

        // Use the provided startNodeId or fallback to "1"
        const startId = startNodeId || "1";
        type === "sequential" ?
            executeSequential(startId) : executeParallel(startId);
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
                event.preventDefault();
                const position = {
                    x: 100 + nodes.length * 40, y: 100 + nodes.length * 40
                };
                setNewNodePosition(position);
                setShowNodeTypeMenu(true);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [nodes]);

    const handleAddNodeOfType = (typeKey) => {
        const newId = `${+new Date()}`;
        // Default node size (should match CustomNode default)
        const nodeWidth = 360;
        const nodeHeight = 180;
        let position = { x: 0, y: 0 };
        if (reactFlowInstance.current && reactFlowInstance.current.project) {
            const graphDiv = document.querySelector('.react-flow');
            if (graphDiv) {
                const rect = graphDiv.getBoundingClientRect();
                // Get the center of the canvas in screen coordinates
                const centerScreen = {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                };
                // Convert to flow coordinates
                let centerFlow = reactFlowInstance.current.project({
                    x: centerScreen.x - rect.left,
                    y: centerScreen.y - rect.top
                });
                // Adjust so the node is centered (not top-left)
                centerFlow.x -= nodeWidth / 2;
                centerFlow.y -= nodeHeight / 2;
                position = centerFlow;
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
            draggable: true,
            sourcePosition: 'right',
            targetPosition: 'left',
            style: { minWidth: 120, minHeight: 80 },
        };
        setNodes((nds) => {
            setTimeout(() => {
                if (reactFlowInstance.current) {
                    reactFlowInstance.current.setCenter
                        (position.x + nodeWidth / 2,
                            position.y + nodeHeight / 2,
                            { zoom: 1.5, duration: 300 });
                }
            }, 0);
            return nds.concat(newNode);
        });
        createTerminal(newId);
        setShowNodeTypeMenu(false);
    };

    // Toggle terminal/editor and run flow
    useEffect(() => {
        const handleKeyDown = (event) => {
            const firstSelectedNodeId = selectedNodes[0];
            const firstSelectedNode = nodes.find
                (n => n.id === firstSelectedNodeId);

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
                    : { ...n, style: { ...n.style, border: "none" } }
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
                        style: {
                            ...e.style,
                            stroke: "#2196f3",
                            strokeWidth: 2
                        },
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
                        !/^[\x1b\[\]0-9;]*[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+:.*\$ ?$/
                            .test(line.trim())
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
            termObj.socket.addEventListener
                ("message", handleMessage, { once: true });

            termObj.socket.send(
                JSON.stringify({
                    type: "command",
                    command,
                })
            );
        }

        // Simulate execution time
        const execT = Math
            .floor(Math.random() * 2000) + 500;
        await new Promise((r) => setTimeout(r, execT));

        // Remove highlight from node
        setNodes((nds) =>
            nds.map((n) =>
                n.id === node.id
                    ? {
                        ...n,
                        style: {
                            ...n.style,
                            border: "none",
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
                        style: {
                            ...e.style,
                            stroke: "#222",
                            strokeWidth: 1
                        },
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
                style: { ...n.style, border: "none" }
            }))
        );
    };

    // Use the first selected node for editor/terminal
    const firstSelectedNode = nodes.find
        (n => n.id === selectedNodes[0]);

    // --- onNodeUpdate: update node data by id ---
    const onNodeUpdate = useCallback((id, newData) => {
        setNodes((nds) =>
            nds.map((n) =>
                n.id === id ? {
                    ...n,
                    data: {
                        ...n.data,
                        ...newData
                    }
                } : n
            )
        );
    }, [setNodes]);

    // --- nodeTypes with onNodeUpdate injected ---
    const nodeTypes = useMemo(() => ({
        base: (props) => <CustomNode {...props}
            data={{
                ...props.data, onNodeUpdate:
                    (data) => onNodeUpdate(props.id, data)
            }} />,
        prompt: Prompt,
        editor: MonacoEditor,
        aiapiselector: AIAPISelector,
        terminal: MiniTerminal,
    }), [onNodeUpdate]);

    return (
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
                <ReactFlowProvider>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange}
                        onEdgeClick={(event, edge) => onEdgesChange(edge)}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onNodeContextMenu={handleNodeContextMenu}
                        onPaneClick={handlePaneClick}
                        onInit={(instance) => (reactFlowInstance.current = instance)}
                        onConnect={
                            (params) =>
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
                        fitView
                        draggable
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

                    </div>
                )}
                {showTerminal && firstSelectedNode && (
                    <div style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        background: "transparent",
                        zIndex: 20,
                        borderTop: "2px solid #333",
                    }}>
                        <Terminal terminalId={firstSelectedNode.id} />
                    </div>
                )}
                {/* Node type selection menu */}
                <NodeTypeMenu
                    nodeTypes={nodeTypes}
                    open={showNodeTypeMenu}
                    onSelect={handleAddNodeOfType}
                    onCancel={() => setShowNodeTypeMenu(false)}
                />
            </div>
            {/* Decoupled LogPane with mouse drag scroll, 
                no visible scrollbar */}
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
    );
};

export default FlowComponent;