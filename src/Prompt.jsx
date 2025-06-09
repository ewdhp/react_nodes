import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from "reactflow";
import NodeMenu from './NodeMenu';
import CustomNode from './CustomNode';

const Prompt = ({ data, style, onSend, ...nodeProps }) => {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState("");
    const [menuOpen, setMenuOpen] = useState(false);
    const textareaRef = useRef(null);
    const scrollRef = useRef(null);
    const menuButtonRef = useRef();
    const { collapsed } = nodeProps;

    const menuItems = [
        { label: 'Clear', onClick: () => setHistory([]) },
        // Add more menu items as needed
    ];

    // Focus textarea on mount
    useEffect(() => {
        if (textareaRef.current) textareaRef.current.focus();
    }, []);

    // Scroll to bottom when history or input changes
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, input]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                const output = onSend ? onSend(input) : undefined;
                setHistory([...history, { prompt: input, response: output }]);
                setInput("");
            }
        }
    };

    return (
        <CustomNode
            {...nodeProps}
            style={{
                ...style,
                background: "#fff",
                color: "#222",
                width: 400,
                height: 300, // fixed height for consistent tall node
                fontFamily: "monospace",
                fontSize: 13,
                boxSizing: 'border-box',
                borderRadius: 8,
                boxShadow: '0 1px 4px rgba(0,0,0,0.13)'
            }}
            menuButton={
                <button
                    ref={menuButtonRef}
                    onClick={() => setMenuOpen((v) => !v)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#888',
                        fontSize: 20,
                        cursor: 'pointer',
                        padding: 2,
                        borderRadius: 4,
                    }}
                    title="Menu"
                >
                    ☰
                </button>
            }
            menu={
                <NodeMenu
                    menuItems={menuItems}
                    open={menuOpen}
                    onClose={() => setMenuOpen(false)}
                    anchorRef={menuButtonRef}
                />
            }
            hideNavBar={false}
            borderRadius={8}
            nodeType="prompt"
        >
            {/* Only render content when not collapsed */}
            {!collapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
                    {/* Handles */}
                    <Handle type="target" position={Position.Left} style={{ background: "#1976d2", width: 10, height: 10, borderRadius: 5, left: -13, top: 32, zIndex: 10 }} />
                    <Handle type="source" position={Position.Right} style={{ background: "#1976d2", width: 10, height: 10, borderRadius: 5, right: -13, top: 32, zIndex: 10 }} />
                    {/* History */}
                    <div ref={scrollRef} className="prompt-scroll" style={{ flex: '1 1 0', overflowY: 'auto', width: '100%', marginBottom: 0, minHeight: 0, maxHeight: '100%' }}>
                        {history.map((entry, index) => (
                            <div key={index}>
                                <span style={{ color: "#388e3c" }}>$</span> {entry.prompt}
                                {entry.response !== undefined && (
                                    <div style={{ color: "#888", whiteSpace: 'pre-wrap' }}>{entry.response}</div>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Input fixed at bottom by flex layout, with only a top border */}
                    <div style={{ width: '100%', borderTop: '1px solid #e0e0e0', flex: '0 0 44px', borderRadius: 0, boxSizing: 'border-box', display: 'flex', alignItems: 'stretch' }}>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={data?.placeholder || "Type a command... (Enter to send, Shift+Enter for newline)"}
                            style={{
                                background: "#f5f5f5",
                                color: "#222",
                                width: '100%',
                                minHeight: 56, // two lines, more space
                                maxHeight: 56, // two lines, more space
                                height: 56, // two lines, more space
                                lineHeight: 1.6,
                                border: 'none',
                                borderRadius: 0,
                                outline: "none",
                                padding: "10px 12px 10px 12px",
                                resize: "none",
                                fontFamily: 'inherit',
                                fontSize: 13,
                                boxSizing: 'border-box',
                                overflow: 'auto',
                                display: 'block',
                            }}
                        />
                    </div>
                </div>
            )}
        </CustomNode>
    );
};

export default Prompt;
