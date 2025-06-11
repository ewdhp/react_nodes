import React from "react";
import { ReactFlowProvider } from "reactflow";
import ReactGraph from "./ReactGraph";
import TerminalProvider from "./TerminalProvider";
function App() {
  return (
    <>
      <TerminalProvider>
        <ReactFlowProvider>
          <ReactGraph />
        </ReactFlowProvider>
      </TerminalProvider>
    </>
  );
}

export default App;