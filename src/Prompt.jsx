import React, { useState } from "react";
import { Handle, Position } from "reactflow";

const Prompt = ({ data, style }) => {
    const [value, setValue] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        // You can add your submit logic here
        setValue("");
    };

    return (
        <div
            style={{
                ...style,
                background: "#f5f7fa",
                border: "2px solid #2196f3",
                borderRadius: 12,
                padding: 12,
                minWidth: 120,
                minHeight: 80,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(33,150,243,0.08)",
                position: "relative"
            }}
        >
            {/* Left (target) handle */}
            <Handle type="target" position={Position.Left} style={{ background: "#2196f3", width: 12, height: 12, borderRadius: 6, left: -6 }} />
            {/* Right (source) handle */}
            <Handle type="source" position={Position.Right} style={{ background: "#2196f3", width: 12, height: 12, borderRadius: 6, right: -6 }} />
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#1976d2" }}>{data?.label || "Prompt"}</div>
            <form onSubmit={handleSubmit} style={{ width: "100%", display: "flex", gap: 6 }}>
                <input
                    type="text"
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    placeholder={data?.placeholder || "Type here..."}
                    style={{
                        flex: 1,
                        padding: 6,
                        borderRadius: 6,
                        border: "1px solid #bbb",
                        fontSize: 14,
                        outline: "none"
                    }}
                />
                <button
                    type="submit"
                    style={{
                        padding: "6px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: "#2196f3",
                        color: "#fff",
                        fontWeight: 500,
                        cursor: "pointer"
                    }}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Prompt;
