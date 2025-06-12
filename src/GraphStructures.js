// Utility to generate unique IDs
function uniqueId(prefix = "node") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Circular graph with n nodes, each connected in a ring (no center)
export function Circular({ setNodes, setEdges, nodes, edges, n = 10 }) {
    const centerX = 400;
    const centerY = 200;
    const radius = 120;
    const newNodes = [];
    const newEdges = [];
    const nodeIds = [];

    for (let i = 0; i < n; ++i) {
        const angle = (2 * Math.PI * i) / n;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const nodeId = uniqueId(`circular_node${i + 1}`);
        nodeIds.push(nodeId);
        newNodes.push({
            id: nodeId,
            type: "base",
            position: { x, y },
            data: {
                label: `Node ${i + 1}`,
                name: `Node ${i + 1}`,
                sourcePosition: "bottom",
                targetPosition: "top"
            }
        });
    }
    for (let i = 0; i < n; ++i) {
        const sourceId = nodeIds[i];
        const targetId = nodeIds[(i + 1) % n];
        newEdges.push({
            id: `${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: false, // set to false for non-animated edges
            type: "default"
        });
    }
    setNodes(nds => [...nds, ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
    return nodeIds;
}

// Add a structure: single vertical chain of 3 nodes, with vertical edges (top-bottom)
export function Vertical({ setNodes, setEdges, nodes, edges }) {
    const baseX = 200;
    const baseY = 100;
    const spacingY = 120;
    const chainLength = 3;

    const newNodes = [];
    const newEdges = [];
    const nodeIds = [];

    let prevId = null;
    for (let i = 0; i < chainLength; ++i) {
        const nodeId = `vertical_chain_node${i + 1}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        nodeIds.push(nodeId);
        newNodes.push({
            id: nodeId,
            type: "base",
            position: {
                x: baseX,
                y: baseY + i * spacingY,
            },
            data: {
                label: `Chain ${i + 1}`,
                name: `Chain ${i + 1}`,
                sourcePosition: "bottom",
                targetPosition: "top"
            },
        });
        if (prevId) {
            newEdges.push({
                id: `${prevId}-${nodeId}`,
                source: prevId,
                target: nodeId,
                animated: false, // set to false for non-animated edges
                type: "default",
            });
        }
        prevId = nodeId;
    }

    setNodes(nds => [...nds, ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
    return nodeIds;
}
// Add a structure: single horizontal chain of 3 nodes, with vertical edges (top-bottom)
export function Horizontal({ setNodes, setEdges, nodes, edges }) {
    const baseX = 200;
    const baseY = 100;
    const spacingY = 120;
    const chainLength = 3;

    const newNodes = [];
    const newEdges = [];
    const nodeIds = [];

    let prevId = null;
    for (let i = 0; i < chainLength; ++i) {
        const nodeId = `vertical_chain_node${i + 1}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        nodeIds.push(nodeId);
        newNodes.push({
            id: nodeId,
            type: "base",
            position: {
                x: baseX + i * spacingY,
                y: baseY,
            },
            data: {
                label: `Chain ${i + 1}`,
                name: `Chain ${i + 1}`,
                sourcePosition: "right",
                targetPosition: "left"
            },
        });
        if (prevId) {
            newEdges.push({
                id: `${prevId}-${nodeId}`,
                source: prevId,
                target: nodeId,
                animated: false, // set to false for non-animated edges
                type: "default",
            });
        }
        prevId = nodeId;
    }

    setNodes(nds => [...nds, ...newNodes]);
    setEdges(eds => [...eds, ...newEdges]);
    return nodeIds;
}

// Export as named functions
export default {
    Vertical,
    Horizontal,
    Circular,
};
