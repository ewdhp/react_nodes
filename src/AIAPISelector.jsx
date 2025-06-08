import React from "react";
import { Handle, Position } from "reactflow";

const AI_API_OPTIONS = [
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
    { value: "google", label: "Google Gemini" },
    { value: "mistral", label: "Mistral" },
    { value: "ollama", label: "Ollama (Local)" },
    // Add more APIs as needed
];

const AIAPISelector = ({ value, onChange, style = {} }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative", ...style, border: "none" }}>
        {/* Left (target) handle */}
        <Handle type="target" position={Position.Left} style={{ background: "#2196f3", width: 12, height: 12, borderRadius: 6, left: -6, top: 32 }} />
        {/* Right (source) handle */}
        <Handle type="source" position={Position.Right} style={{ background: "#2196f3", width: 12, height: 12, borderRadius: 6, right: -6, top: 32 }} />
        <label style={{ fontWeight: 600, color: "#1976d2", marginBottom: 2 }}>
            AI API Provider
        </label>
        <select
            value={value}
            onChange={e => onChange(e.target.value)}
            style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #2196f3",
                fontSize: 15,
                background: "#f5f7fa",
                color: "#222",
                outline: "none",
                fontWeight: 500
            }}
        >
            {AI_API_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
        </select>
    </div>
);

export default AIAPISelector;
