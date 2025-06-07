import React, { useEffect, useRef } from "react";
import { useTerminalSocket } from "./TerminalProvider";

const TERMINAL_ID = "main";

export const Terminal = ({ terminalId = TERMINAL_ID }) => {
    const { createTerminal, getTerminal } = useTerminalSocket();
    const containerRef = useRef(null);
    const openedRef = useRef(false);

    useEffect(() => {
        let termObj = getTerminal(terminalId);
        if (!termObj) {
            createTerminal(terminalId);
            termObj = getTerminal(terminalId);
        }
        if (termObj && containerRef.current && !openedRef.current) {
            termObj.terminal.open(containerRef.current);
            termObj.fitAddon.fit();
            termObj.terminal.focus();
            openedRef.current = true;

            // Fit on window resize
            const handleResize = () => {
                termObj.fitAddon.fit();
            };
            window.addEventListener("resize", handleResize);
            return () => {
                window.removeEventListener("resize", handleResize);
            };
        }
    }, [createTerminal, getTerminal, terminalId]);

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                minHeight: 0,
                minWidth: 0,

                border: "1px solid #ccc",
                padding: "10px",
                boxShadow: "0 4px 16px rgba(0,0,0,0.35)"
            }}
        />
    );
};