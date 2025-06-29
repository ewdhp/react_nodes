import React from "react";
import { ReactFlowProvider } from "reactflow";
import ReactGraph from "./components/ReactGraph";
import TerminalProvider from "./components/TerminalProvider";
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