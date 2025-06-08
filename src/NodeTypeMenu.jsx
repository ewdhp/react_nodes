import React, { useEffect, useRef, useState } from "react";

function NodeTypeMenu({ nodeTypes, onSelect, onCancel, open }) {
    const [focusIdx, setFocusIdx] = useState(0);
    const menuRef = useRef();
    const keys = Object.keys(nodeTypes);

    useEffect(() => {
        if (open) setFocusIdx(0);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setFocusIdx((idx) => (idx + 1) % keys.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setFocusIdx((idx) => (idx - 1 + keys.length) % keys.length);
            } else if (e.key === "Enter") {
                e.preventDefault();
                onSelect(keys[focusIdx]);
            } else if (e.key === "Escape") {
                onCancel();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, focusIdx, keys, onSelect, onCancel]);

    if (!open) return null;
    return (
        <div
            ref={menuRef}
            style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#fff",
                border: "1px solid #2196f3",
                borderRadius: 8,
                boxShadow: "0 2px 12px rgba(33,150,243,0.12)",
                zIndex: 1000,
                padding: 12,
                minWidth: 180,
            }}
        >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Node Type</div>
            {keys.map((typeKey, idx) => (
                <button
                    key={typeKey}
                    onClick={() => onSelect(typeKey)}
                    style={{
                        display: "block",
                        width: "100%",
                        padding: "8px 0",
                        marginBottom: 6,
                        border: focusIdx === idx ? "2px solid #2196f3" : "none",
                        borderRadius: 4,
                        background: focusIdx === idx ? "#bbdefb" : "#e3f2fd",
                        color: "#1976d2",
                        fontWeight: 500,
                        cursor: "pointer",
                        outline: focusIdx === idx ? "2px solid #2196f3" : "none",
                    }}
                    tabIndex={0}
                    onMouseEnter={() => setFocusIdx(idx)}
                >
                    {typeKey.charAt(0).toUpperCase() + typeKey.slice(1)}
                </button>
            ))}
            <button
                onClick={onCancel}
                style={{
                    display: "block",
                    width: "100%",
                    padding: "8px 0",
                    border: "none",
                    borderRadius: 4,
                    background: "#eee",
                    color: "#888",
                    fontWeight: 500,
                    cursor: "pointer",
                }}
            >
                Cancel
            </button>
        </div>
    );
}

export default NodeTypeMenu;
