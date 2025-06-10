import React, { useState } from "react";
import { Handle } from "reactflow";

const PlayButton = ({ onClick }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" onClick={onClick} style={{ cursor: "pointer" }}>
        <path fill="gray" d="M8 5v14l11-7z" />
    </svg>
);

const ExpandedNode = ({ name, content }) => (
    <div style={{
        padding: "10px",
        border: "1px solid black",
        borderRadius: "5px",
        width: "200px",
        minHeight: content ? "auto" : "40px",
        display: "flex",
        flexDirection: "column"
    }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>{name}</span>
            <PlayButton />
        </div>
        {content && <div style={{ marginTop: "10px" }}>{content}</div>}
    </div>
);

const CollapsedNode = () => (
    <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        border: "1px solid black",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }}>
        <PlayButton />
    </div>
);

const BaseNode = ({ data = {} }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const toggleNode = () => setIsExpanded(!isExpanded);

    return (
        <NodeWrapper onDoubleClick={toggleNode}> {/* Double-click toggles state */}
            {isExpanded ? (
                <ExpandedNode name={data.name || "Unnamed"} content={data.content} />
            ) : (
                <CollapsedNode />
            )}
        </NodeWrapper>
    );
};

// Wrapper component for managing edges
const NodeWrapper = ({ children, onDoubleClick }) => (
    <div style={{ position: "relative", padding: "20px" }} onDoubleClick={onDoubleClick}>
        <Handle type="source" position="right" style={{ right: "-15px", background: '#555' }} isConnectable={true} />
        <Handle type="target" position="left" style={{ left: "-15px", background: '#555' }} isConnectable={true} />
        {children}
    </div>
);

export default BaseNode;