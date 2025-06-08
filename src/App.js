import React from "react";
import FlowComponent from "./FlowComponent";
import TerminalProvider from "./TerminalProvider";
function App() {
  return (
    <TerminalProvider>
      <FlowComponent />
    </TerminalProvider>
  );
}

export default App;