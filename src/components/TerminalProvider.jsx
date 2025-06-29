import React, { createContext, useContext, useRef } from 'react';

// Create Context
const TerminalContext = createContext();

// Provider Component
export const TerminalProvider = ({ children }) => {
    const terminals = useRef(new Map());
    const outputListeners = useRef(new Map());

    const createTerminal = (id) => {
        if (terminals.current.has(id)) {
            console.warn(`Terminal with ID "${id}" already exists.`);
            return terminals.current.get(id);
        }

        console.log(`Creating terminal with ID "${id}"...`);

        const socket = new WebSocket('wss://localhost:5500');
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
        const listeners = outputListeners.current.get(id);
        if (listeners) {
            listeners.forEach((cb) => cb(data));
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
    const subscribeToOutput = (id, callback) => {
        if (!outputListeners.current.has(id)) {
            outputListeners.current.set(id, []);
        }
        outputListeners.current.get(id).push(callback);
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

    const disposeTerminal = (id) => {
        const terminalData = terminals.current.get(id);
        if (terminalData) {
            console.log(`Disposing terminal with ID "${id}"...`);
            terminalData.socket.close();
            terminals.current.delete(id);
            outputListeners.current.delete(id);
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