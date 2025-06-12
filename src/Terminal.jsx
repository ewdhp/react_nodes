import { useState, useEffect, useRef } from 'react';
import { useTerminalSocket } from './TerminalProvider';

// --- CustomTerminal component ---
const CustomTerminal = ({ terminalId }) => {
    const { sendInput, subscribeToOutput } = useTerminalSocket();
    const [lines, setLines] = useState([]);
    const [input, setInput] = useState('');
    const [showCursor, setShowCursor] = useState(true);
    const [prompt, setPrompt] = useState('> ');
    const outputRef = useRef(null);
    const inputRef = useRef(null);
    const waitingForPrompt = useRef(false);

    useEffect(() => {
        const unsubscribe = subscribeToOutput(terminalId, (data) => {
            setLines(prev => {
                const split = data.split(/\r?\n/);
                let newLines = [...prev];
                if (newLines.length === 0) newLines.push('');
                newLines[newLines.length - 1] += split[0];
                for (let i = 1; i < split.length; ++i) {
                    newLines.push(split[i]);
                }
                // Only detect prompt from the very first message
                if (prompt === '> ') {
                    // Try to detect prompt in the first message only
                    const last = newLines[newLines.length - 1] || '';
                    // Remove ANSI escape codes and bell chars
                    const clean = last.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/[\x07\x1b].*?[\x07]/g, '').replace(/\x1b\].*?\x07/g, '');
                    // Heuristic: prompt ends with $ or # or > and a space
                    let detectedPrompt = null;
                    const match = clean.match(/([^\n\r]*[>#\$] ?)$/);
                    if (match) {
                        detectedPrompt = match[1];
                        setPrompt(detectedPrompt);
                    }
                }
                // After sending a command, add a blank line for our own prompt if needed
                if (waitingForPrompt.current) {
                    waitingForPrompt.current = false;
                    newLines.push('');
                }
                return newLines;
            });
        });
        return () => {
            unsubscribe && unsubscribe();
        };
    }, [terminalId, subscribeToOutput, prompt]);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [lines]);

    useEffect(() => {
        const interval = setInterval(() => setShowCursor((v) => !v), 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        inputRef.current && inputRef.current.focus();
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (input.trim() !== '') {
                setLines(prev => [...prev, input]);
                sendInput(terminalId, input);
                waitingForPrompt.current = true;
            }
            setInput('');
        } else if (e.key === 'Backspace') {
            e.preventDefault();
            setInput((prev) => prev.slice(0, -1));
        } else if (
            e.key.length === 1 &&
            !e.ctrlKey &&
            !e.metaKey &&
            !e.altKey
        ) {
            setInput((prev) => prev + e.key);
        }
    };

    // Render all output lines except the last
    const renderLines = lines.length > 0 ? lines.slice(0, -1) : [];
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';

    // Decide if we need to show our own prompt
    let showPrompt = prompt;
    if (lastLine.endsWith(prompt)) {
        showPrompt = '';
    }

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: '#181818',
                color: '#fff',
                fontFamily: 'monospace',
                fontSize: 14,
                padding: 0,
                position: 'absolute',
                top: 0,
                left: 0,
            }}
            onClick={() => inputRef.current && inputRef.current.focus()}
        >
            <div
                ref={outputRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 8,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    background: '#181818',
                }}
                tabIndex={0}
            >
                {renderLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                ))}
                <div>
                    {lastLine}
                </div>
                {/* Only show prompt if not already present */}
                {showPrompt !== '' && (
                    <span>
                        {showPrompt}
                        {input}
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            background: showCursor ? '#fff' : 'transparent',
                            marginLeft: '-2px'
                        }}>&nbsp;</span>
                    </span>
                )}
                {/* If prompt is present, just show input and cursor after it */}
                {showPrompt === '' && (
                    <span>
                        {input}
                        <span style={{
                            display: 'inline-block',
                            width: '8px',
                            background: showCursor ? '#fff' : 'transparent',
                            marginLeft: '-2px'
                        }}>&nbsp;</span>
                    </span>
                )}
            </div>
            <input
                ref={inputRef}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    pointerEvents: 'none',
                    height: 0,
                    width: 0,
                }}
                value={input}
                onKeyDown={handleKeyDown}
                onChange={() => { }}
                autoFocus
            />
        </div>
    );
};

// --- Terminal component ---
const Terminal = ({ terminalId }) => {
    return <CustomTerminal terminalId={terminalId} />;
};

// --- TerminalTabs component (no MUI) ---
const TerminalTabs = () => {
    const [terminals, setTerminals] = useState([]);
    const [activeTab, setActiveTab] = useState(0);
    const { createTerminal, getAllTerminals } = useTerminalSocket();

    useEffect(() => {
        const activeTerminals = getAllTerminals();
        setTerminals(activeTerminals);
        activeTerminals.forEach((id) => {
            createTerminal(id);
        });
    }, [getAllTerminals, createTerminal]);

    const handleTabChange = (index) => {
        setActiveTab(index);
    };

    const handleAddTerminal = () => {
        const newTerminalId = `terminal${terminals.length + 1}`;
        setTerminals((prev) => [...prev, newTerminalId]);
        createTerminal(newTerminalId); // <-- Ensure terminal is created
        setActiveTab(terminals.length);
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#232323'
        }}>
            {/* Tabs Section */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                borderBottom: '1px solid #444',
                background: '#181818'
            }}>
                <div style={{ display: 'flex', flexGrow: 1 }}>
                    {terminals.map((id, index) => (
                        <button
                            key={id}
                            onClick={() => handleTabChange(index)}
                            style={{
                                background: activeTab === index ? '#333' : '#222',
                                color: '#fff',
                                border: 'none',
                                borderBottom: activeTab === index ? '2px solid #00bcd4' : '2px solid transparent',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                outline: 'none',
                                marginRight: 2,
                                fontWeight: activeTab === index ? 'bold' : 'normal'
                            }}
                        >
                            Terminal {index + 1}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleAddTerminal}
                    style={{
                        background: '#00bcd4',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 12px',
                        marginLeft: 8,
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    {/* You can replace this with a "+" or SVG if not using MUI icons */}
                    <span style={{ fontSize: 18, marginRight: 4 }}>+</span>
                    Add Terminal
                </button>
            </div>
            {/* Terminal Content Section */}
            <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
                {terminals.map((id, index) => (
                    <div
                        key={id}
                        style={{
                            display: activeTab === index ? 'block' : 'none',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                        }}
                    >
                        <Terminal terminalId={id} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TerminalTabs;