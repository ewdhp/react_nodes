import React, { useState } from "react";
import CustomNode from "./CustomNode";

const MiniTerminalContent = () => {
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState("");

    const executeCommand = (command) => {
        let response;
        switch (command.trim()) {
            case "hello":
                response = "Hello, Hector!";
                break;
            case "date":
                response = new Date().toLocaleString();
                break;
            default:
                response = `Command not found: ${command}`;
        }
        return response;
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const output = executeCommand(input);
            setHistory([...history, { prompt: input, response: output }]);
            setInput("");
        }
    };

    return (
        <div style={{ background: "#111", color: "white", padding: "10px", fontFamily: "monospace", cursor: "grab", borderRadius: 8, minWidth: 220, overflow: 'auto' }} className="mini-terminal-scroll">
            {history.map((entry, index) => (
                <div key={index}>
                    <span style={{ color: "lightgreen" }}> $ </span> {entry.prompt}
                    <div style={{ color: "gray" }}>{entry.response}</div>
                </div>
            ))}
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                rows={3}
                style={{
                    background: "#111",
                    color: "white",
                    width: "100%",
                    height: "100%",
                    border: "none",
                    outline: "none",
                    padding: "5px",
                    resize: "none",
                    cursor: "grab",
                    cursor: "default",
                }}
            />
        </div>
    );
};

// MiniTerminal node that uses CustomNode and injects MiniTerminalContent as content
const MiniTerminal = (props) => {
    return <CustomNode {...props} hideNavBar={true} data={{ ...props.data, content: <MiniTerminalContent /> }} />;
};

export const MiniTerminalNode = MiniTerminal;
export default MiniTerminal;