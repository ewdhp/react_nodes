import React, { createContext, useContext, useRef } from 'react';

// Create Context
const TerminalContext = createContext();

// Provider Component
export const TerminalProvider = ({ children }) => {
    const terminals = useRef(new Map());
    const outputListeners = useRef(new Map());
    const terminalOutputHistory = useRef(new Map()); // Store output history for each terminal

    const createTerminal = (id) => {
        if (terminals.current.has(id)) {
            console.warn(`Terminal with ID "${id}" already exists.`);
            return terminals.current.get(id);
        }

        console.log(`Creating terminal with ID "${id}"...`);

        const socket = new WebSocket('wss://localhost:5001');
        const inputBuffer = { current: '' };

        terminals.current.set(id, { socket, inputBuffer });

        socket.onopen = () => {
            console.log(`WebSocket connection established for terminal "${id}"`);
            sendToListeners(id, 'Connected to WebSocket server\n');
            socket.send(
                JSON.stringify({
                    type: 'connect',
                    host: 'localhost',
                    username: 'ewd',
                    password: '2020',
                })
            );
            sendToListeners(id, '\n> ');
        };

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);

                switch (msg.type) {
                    case 'output':
                        sendToListeners(id, msg.data);
                        break;
                    case 'connected':
                        sendToListeners(id, '\n[SSH CONNECTED]\n> ');
                        break;
                    case 'disconnected':
                        sendToListeners(id, '\n[SSH DISCONNECTED]');
                        break;
                    case 'error':
                        sendToListeners(id, `\n[ERROR]: ${msg.message}`);
                        break;
                    case 'status':
                        sendToListeners(id, `\n[STATUS]: ${msg.message}`);
                        break;
                    default:
                        sendToListeners(id, event.data);
                        break;
                }
            } catch (e) {
                sendToListeners(id, event.data);
            }
        };

        socket.onerror = (error) => {
            console.error(`WebSocket error for terminal "${id}":`, error);
            sendToListeners(id, `[WebSocket error]\n`);
        };

        socket.onclose = () => {
            console.log(`WebSocket connection closed for terminal "${id}"`);
            sendToListeners(id, '[WebSocket Closed]');
        };

        return { socket, inputBuffer };
    };

    const sendToListeners = (id, data) => {
        // Store the data in history
        if (!terminalOutputHistory.current.has(id)) {
            terminalOutputHistory.current.set(id, '');
        }
        terminalOutputHistory.current.set(id, terminalOutputHistory.current.get(id) + data);
        
        const listeners = outputListeners.current.get(id);
        if (listeners) {
            // Send new data to listeners (not marked as history)
            listeners.forEach((cb) => cb(data, { isHistory: false }));
        }
    };

    // Send input to the server for a terminal
    const sendInput = (id, input) => {
        const terminalData = terminals.current.get(id);
        if (!terminalData) return;
        const { socket } = terminalData;
        console.log(`Sending input to terminal "${id}":`, input);
        if (input.trim() === '') return;
        socket.send(
            JSON.stringify({
                type: 'command',
                command: input.trim(),
            })
        );
    };

    // Subscribe to output for a terminal
    const subscribeToOutput = (id, callback, options = {}) => {
        if (!outputListeners.current.has(id)) {
            outputListeners.current.set(id, []);
        }
        outputListeners.current.get(id).push(callback);
        
        // Send existing history to new subscriber only if requested
        if (options.includeHistory !== false) {
            const history = terminalOutputHistory.current.get(id);
            if (history) {
                // Mark this as historical data
                callback(history, { isHistory: true });
            }
        }
        
        // Return unsubscribe function
        return () => {
            const arr = outputListeners.current.get(id) || [];
            outputListeners.current.set(
                id,
                arr.filter((cb) => cb !== callback)
            );
        };
    };

    const getTerminal = (id) => {
        return terminals.current.get(id);
    };

    const getAllTerminals = () => {
        return Array.from(terminals.current.keys());
    };

    const getTerminalHistory = (id) => {
        return terminalOutputHistory.current.get(id) || '';
    };

    const clearTerminalHistory = (id) => {
        terminalOutputHistory.current.set(id, '');
    };

    const disposeTerminal = (id) => {
        const terminalData = terminals.current.get(id);
        if (terminalData) {
            console.log(`Disposing terminal with ID "${id}"...`);
            terminalData.socket.close();
            terminals.current.delete(id);
            outputListeners.current.delete(id);
            terminalOutputHistory.current.delete(id);
        } else {
            console.warn(`Terminal with ID "${id}" does not exist.`);
        }
    };

    return (
        <TerminalContext.Provider
            value={{
                createTerminal,
                getTerminal,
                getAllTerminals,
                getTerminalHistory,
                clearTerminalHistory,
                disposeTerminal,
                sendInput,
                subscribeToOutput,
            }}
        >
            {children}
        </TerminalContext.Provider>
    );
};

// Custom Hook for Using Context
export const useTerminalSocket = () => {
    const context = useContext(TerminalContext);
    if (!context) {
        throw new Error('useTerminalSocket must be used within a TerminalProvider');
    }
    return context;
};

export default TerminalProvider;