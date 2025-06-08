import React from "react";
import MonacoEditor from "@monaco-editor/react";

const MonacoEditorComponent = ({ value, language = "javascript", onChange, height = "300px" }) => (
    <div style={{ border: "1px solid #ccc", borderRadius: 4, overflow: "hidden" }}>
        <MonacoEditor
            height={height}
            defaultLanguage={language}
            value={value}
            theme="vs-light"
            options={{ minimap: { enabled: false } }}
            onChange={onChange}
        />
    </div>
);

export default MonacoEditorComponent;
