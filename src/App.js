import React from "react";
import { TerminalProvider } from "./TerminalProvider";
import { Terminal } from "./Terminal";
import FlowComponent from "./FlowComponent";

function App() {
  return (
    <TerminalProvider>
      <FlowComponent />
    </TerminalProvider>
  );
}

export default App;