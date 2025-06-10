import ReactFlow, { Controls, Background, applyNodeChanges } from "reactflow";
import "reactflow/dist/style.css";
import { useCallback, useState } from "react";
import BaseNode from "./BaseNode";

const nodeTypes = {
  baseNode: BaseNode,
};

const initialNodes = [
  { id: "1", type: "baseNode", position: { x: 100, y: 100 }, data: { name: "Task 1", content: "Execute step" }, sourcePosition: "right", targetPosition: "left" },
  { id: "2", type: "baseNode", position: { x: 300, y: 200 }, data: { name: "Task 2" }, sourcePosition: "right", targetPosition: "left" },
];

const initialEdges = [];

export default function ReactGraph() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  // Handles node movement
  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);

  // Handles edge updates (if style or connection updates occur)
  const onEdgesChange = useCallback((changes) => setEdges((eds) => eds.map((e) => ({ ...e, ...changes }))), []);

  // Creates a new edge when connecting nodes
  const onConnect = useCallback((connection) => {
    setEdges((eds) => [...eds, { ...connection, id: `${connection.source}-${connection.target}`, animated: true }]);
  }, []);

  // Removes edge when clicked
  const onEdgeClick = useCallback((event, edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick} // Enable edge deletion on click
        fitView
      >
        <Controls />
        <Background color="#f0f0f0" gap={20} />
      </ReactFlow>
    </div>
  );
}