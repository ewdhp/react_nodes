import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";
import Monaco from "@monaco-editor/react";

const MonacoEditor = ({ data, style, onSend }) => {

    return (
        <div
            style={{
                ...style,
                padding: 12,
                minWidth: '600px',
                minHeight: '500px',
                display: "flex",
                flexDirection: "column",
                alignItems: "stretch",
                justifyContent: "flex-start",
                position: "relative",
                fontSize: 12,
                border: "none",
                background: "#f5f5f5",
                width: "100%",
                height: "100%"
            }}
        >
            {/* Left (target) handle */}
            <Handle type="target" position={Position.Left} style={{ background: "#1976d2", width: 10, height: 10, borderRadius: 6, left: -13, top: 40, zIndex: 10 }} />
            {/* Right (source) handle */}
            <Handle type="source" position={Position.Right} style={{ background: "#1976d2", width: 10, height: 10, borderRadius: 6, right: -13, top: 40, zIndex: 10 }} />
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#222" }}>{data?.label || "Editor"}</div>
            <div style={{ width: "100%", flex: 1, minHeight: 120, height: "100%" }}>
                <Monaco
                    height="590px"
                    width="600px"
                    defaultLanguage={data?.language || "javascript"}
                    value={data?.value || ""}
                    theme="vs-dark"
                    options={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        minimap: { enabled: true },
                        scrollBeyondLastLine: false,
                        wordWrap: "on",
                        automaticLayout: true,
                        lineNumbers: "on"
                    }}
                    onChange={data?.onChange}
                />
            </div>
        </div>
    );
};

export default MonacoEditor;
