// Add a structure: single vertical chain of 3 nodes, with vertical edges (top-bottom)
export function Vertical({ setNodes, setEdges, nodes, edges }) {
    const baseX = 0;
    const baseY = 0;
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
const GraphStructures = {
    Vertical,
    Horizontal,
};

export default GraphStructures;
