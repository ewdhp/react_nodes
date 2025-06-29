// NodeUpdateContext.js
import { createContext, useContext } from "react";
export const NodeUpdateContext = createContext(null);

export const useNodeUpdate = () => {
    const ctx = useContext(NodeUpdateContext);
    if (!ctx) throw new Error("useNodeUpdate must be used within a NodeUpdateContext.Provider");
    return ctx;
};

export const NodeUpdateProvider = NodeUpdateContext.Provider;