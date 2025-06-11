import React, { useState } from "react";
import { Handle } from "reactflow";


const Node = ({ data = {} }) => {
    const [showContent, setShowContent] = useState(false);
    const handleDoubleClick = () => {
        if (!data.content) return;
        setShowContent(v => !v);
    };
    return (
        <div style={{ position: "relative", display: "inline-block" }} onDoubleClick={handleDoubleClick}>
            <Handle type="source" position="right" style={{ right: 0, background: '#555' }} isConnectable={true} />
            <Handle type="target" position="left" style={{ left: 0, background: '#555' }} isConnectable={true} />
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {!showContent && <span>{data.name || "Task"}</span>}
                </div>
                {showContent && data.content && <div style={{ marginTop: "10px" }}>{data.content}</div>}
            </div>
        </div>
    );
};

export default Node;