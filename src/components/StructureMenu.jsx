import React from "react";

export default function StructureMenu({
    show,
    structureMenuIndex,
    setStructureMenuIndex,
    setShowStructureMenu,
    structureItems,
    setNodes,
    setEdges,
    nodes,
    edges,
    selectNodesByIds
}) {
    if (!show) return null;
    return (
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
                {structureItems.map((item, idx) => (
                    <li
                        key={item.key}
                        style={{
                            padding: "14px 28px",
                            background: structureMenuIndex === idx ? "#e3f2fd" : undefined,
                            color: structureMenuIndex === idx ? "#1976d2" : "#222",
                            fontWeight: structureMenuIndex === idx ? "bold" : "normal",
                            cursor: "pointer"
                        }}
                        onMouseEnter={() => setStructureMenuIndex(idx)}
                        onClick={() => {
                            const newIds = item.fn({ setNodes, setEdges, nodes, edges });
                            setTimeout(() => selectNodesByIds(newIds), 0);
                            setShowStructureMenu(false);
                        }}
                    >
                        {item.label}
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
    );
}
