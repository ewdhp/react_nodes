import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";

const Prompt = ({ data, style, onSend }) => {
    const [value, setValue] = useState("");
    const textareaRef = useRef(null);

    // Focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) textareaRef.current.focus();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) {
                if (onSend) onSend(value);
                setValue("");
            }
        }
    };

    return (
        <div
            style={{
                ...style,
                padding: 12,
                minWidth: 240,
                minHeight: 120,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                fontSize: 11,
                border: "none", // removed border
            }}
        >
            {/* Left (target) handle */}
            <Handle type="target" position={Position.Left} style={{ background: "black", width: 8, height: 8, borderRadius: 6, left: -13 }} />
            {/* Right (source) handle */}
            <Handle type="source" position={Position.Right} style={{ background: "black", width: 8, height: 8, borderRadius: 6, right: -13 }} />
            <div style={{ fontWeight: 600, marginBottom: 8, color: "black" }}>{data?.label || "Prompt"}</div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={data?.placeholder || "Type here... (Enter to send, Shift+Enter for newline)"}
                rows={3}
                style={{
                    width: "100%",
                    minHeight: 48,
                    resize: "vertical",
                    borderRadius: 6,
                    fontSize: 11,
                    outline: "none",
                    padding: 6,
                    marginBottom: 6,
                    fontFamily: "inherit"
                }}
            />
        </div>
    );
};

export default Prompt;
