import React, { useState } from "react";
import { Handle } from "reactflow";


const Node = ({ data = {}, id, selected, setNodes }) => {
    const [renaming, setRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(data.name || "Task");
    const [showContent, setShowContent] = useState(false);
    const inputRef = React.useRef(null);

    // Sync renameValue with data.name if it changes externally
    React.useEffect(() => {
        setRenameValue(data.name || "Task");
    }, [data.name]);

    // Listen for 'i' key to enter renaming mode if not already renaming and not showing content
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'i' && !renaming && !showContent) {
                setRenaming(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [renaming, showContent]);

    // Swap: double-click shows content, right-click enables renaming
    const handleDoubleClick = (e) => {
        setShowContent(v => !v);
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        setRenaming(true);
    };

    const handleRenameInputChange = (e) => setRenameValue(e.target.value);
    const handleRenameInputKeyDown = (e) => {
        if (e.key === "Enter") {
            if (setNodes) {
                setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, name: renameValue } } : n));
            }
            setRenaming(false);
        } else if (e.key === "Escape") {
            setRenaming(false);
        }
        // Remove the blur on any other key, so Backspace and normal typing do not blur/cancel
    };
    const handleRenameBlur = () => {
        if (setNodes) {
            setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, name: renameValue } } : n));
        }
        setRenaming(false);
    };

    React.useEffect(() => {
        if (renaming && inputRef.current) {
            inputRef.current.focus();
            // Only select text when just entering renaming mode
            inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
        }
    }, [renaming]);

    return (
        <div
            style={{

            }}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            data-id={id}
        >
            <Handle type="source" position="right" style={{ right: 0, background: '#555' }} isConnectable={true} />
            <Handle type="target" position="left" style={{ left: 0, background: '#555' }} isConnectable={true} />
            <div style={{
                display: "flex",
                flexDirection: "column",
                padding: "10px",
                alignItems: "center"
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 24, position: 'relative', border: 'none', background: 'none', boxShadow: 'none' }}>
                    {(!showContent) && (renaming ? (
                        <input
                            ref={inputRef}
                            autoFocus
                            value={renameValue}
                            onChange={handleRenameInputChange}
                            onKeyDown={handleRenameInputKeyDown}
                            onBlur={handleRenameBlur}
                            style={{
                                fontSize: 10,
                                borderRadius: 4,
                                border: "1px solid #888",
                                padding: "2px 6px",
                                textAlign: "center",
                                background: "#fff",
                                width: `${renameValue.length + 1}ch`,
                                visibility: 'visible',
                                pointerEvents: 'auto',
                                outline: "none",
                            }}
                        />
                    ) : (
                        <input
                            value={renameValue}
                            readOnly
                            tabIndex={-1}
                            style={{
                                fontSize: 10,
                                borderRadius: 4,
                                border: "1px solid #888",
                                padding: "2px 6px",
                                textAlign: "center",
                                background: "#fff",
                                width: `${renameValue.length + 1}ch`,
                                color: '#222',
                                cursor: 'pointer',
                                pointerEvents: 'none',
                                userSelect: 'none',
                            }}
                        />
                    ))}
                    {showContent && (
                        <div
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                // Calculate offset so the center of the textarea matches the center of the input
                                transform: `translate(-50%, -50%)`,
                                zIndex: 10,
                                border: 'none',
                                background: 'none',
                                boxShadow: 'none',
                                minWidth: 0,
                                width: 'auto',
                                whiteSpace: 'pre-line',
                                padding: 0,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            {/* Remove textarea and only show data.content if present */}
                            {data.content ? data.content : null}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Node;