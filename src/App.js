import React from "react";
import { ReactFlowProvider } from "reactflow";
import ReactGraph from "./ReactGraph";
function App() {
  return (
    <>
      <ReactFlowProvider>
        <ReactGraph />
      </ReactFlowProvider>
    </>
  );
}

export default App;