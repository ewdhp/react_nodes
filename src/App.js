import React from "react";
import { ReactFlowProvider } from "reactflow";
import ReactGraph from "./ReactGraph";
import TerminalProvider from "./components/TerminalProvider";
import "./App.css";

function App() {
  return (
    <div className="App" style={{ height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <TerminalProvider>
        <ReactFlowProvider>
          <ReactGraph />
        </ReactFlowProvider>
      </TerminalProvider>
    </div>
  );
}

export default App;