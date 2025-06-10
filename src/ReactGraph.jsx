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

const initialEdges = [
  { id: "e1-2", source: "1", target: "2", type: "default", animated: true }
];

export default function ReactGraph() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => eds.map((e) => ({ ...e, ...changes }))), []);

  return (
    <div style={{ width: "100vw", height: "100vh" }}> {/* Ensure full-screen space */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        fitView
      >
        <Controls />
        <Background color="#f0f0f0" gap={20} />
      </ReactFlow>
    </div>

  );
}