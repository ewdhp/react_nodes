// Utility to generate unique IDs
function uniqueId(prefix = "node") {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

// Circle/star graph (same as previous generateCircleGraph)
export function CircleGraph({ setNodes, setEdges, nodes, edges }) {
    const centerX = 400, centerY = 400, radius = 250, nodeCount = 10;
    const timestamp = Date.now();
    const centerId = uniqueId("center");
    const newNodes = [{
        id: centerId,
        position: { x: centerX, y: centerY },
        type: 'base',
        data: { label: 'Center' },
    }];
    const newEdges = [];
    for (let i = 0; i < nodeCount; i++) {
        const angle = (2 * Math.PI * i) / nodeCount;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const nodeId = uniqueId(`node${i + 1}`);
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
    setNodes(prev => [
        ...prev.map(n => ({ ...n, selected: false })),
        ...newNodes.map(n => ({ ...n, selected: true }))
    ]);
    setEdges(prev => [...prev, ...newEdges]);
    return newNodes.map(n => n.id);
}

// Matrix 4x4 grid
export function Matrix4x4({ setNodes, setEdges, nodes, edges }) {
    const startX = 100, startY = 100, gap = 90;
    const newNodes = [];
    const newEdges = [];
    const ids = [];
    for (let row = 0; row < 4; row++) {
        ids[row] = [];
        for (let col = 0; col < 4; col++) {
            const id = uniqueId(`m${row}${col}`);
            ids[row][col] = id;
            newNodes.push({
                id,
                position: { x: startX + col * gap, y: startY + row * gap },
                type: 'base',
                data: { label: `(${row + 1},${col + 1})` },
            });
        }
    }
    // Connect horizontally and vertically
    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            if (col < 3) {
                newEdges.push({
                    id: uniqueId("e"),
                    source: ids[row][col],
                    target: ids[row][col + 1],
                });
            }
            if (row < 3) {
                newEdges.push({
                    id: uniqueId("e"),
                    source: ids[row][col],
                    target: ids[row + 1][col],
                });
            }
        }
    }
    setNodes(prev => [
        ...prev.map(n => ({ ...n, selected: false })),
        ...newNodes.map(n => ({ ...n, selected: true }))
    ]);
    setEdges(prev => [...prev, ...newEdges]);
    return newNodes.map(n => n.id);
}

// Simple chain of 5 nodes
export function Chain5({ setNodes, setEdges, nodes, edges }) {
    const startX = 150, startY = 300, gap = 100;
    const newNodes = [];
    const newEdges = [];
    let prevId = null;
    for (let i = 0; i < 5; i++) {
        const id = uniqueId("chain");
        newNodes.push({
            id,
            position: { x: startX + i * gap, y: startY },
            type: 'base',
            data: { label: `Chain ${i + 1}` },
        });
        if (prevId) {
            newEdges.push({
                id: uniqueId("e"),
                source: prevId,
                target: id,
            });
        }
        prevId = id;
    }
    setNodes(prev => [
        ...prev.map(n => ({ ...n, selected: false })),
        ...newNodes.map(n => ({ ...n, selected: true }))
    ]);
    setEdges(prev => [...prev, ...newEdges]);
    return newNodes.map(n => n.id);
}

// Star with 6 leaves
export function Star6({ setNodes, setEdges, nodes, edges }) {
    const centerX = 600, centerY = 200, radius = 120;
    const centerId = uniqueId("starcenter");
    const newNodes = [{
        id: centerId,
        position: { x: centerX, y: centerY },
        type: 'base',
        data: { label: 'Star Center' },
    }];
    const newEdges = [];
    for (let i = 0; i < 6; i++) {
        const angle = (2 * Math.PI * i) / 6;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        const nodeId = uniqueId(`starleaf${i + 1}`);
        newNodes.push({
            id: nodeId,
            position: { x, y },
            type: 'base',
            data: { label: `Leaf ${i + 1}` },
        });
        newEdges.push({
            id: uniqueId("e"),
            source: centerId,
            target: nodeId,
        });
    }
    setNodes(prev => [
        ...prev.map(n => ({ ...n, selected: false })),
        ...newNodes.map(n => ({ ...n, selected: true }))
    ]);
    setEdges(prev => [...prev, ...newEdges]);
    return newNodes.map(n => n.id);
}

// Export as named functions
export default {
    CircleGraph,
    Matrix4x4,
    Chain5,
    Star6,
};
