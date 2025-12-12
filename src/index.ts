import { JupyterFrontEnd, JupyterFrontEndPlugin } from "@jupyterlab/application";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

/**
 * The JupyterLab plugin.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: "assignments-ui",
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log("Assignments UI extension activated!");

    // Check if already exists (avoid multiple mounts)
    let node = document.getElementById("assignments-ui-root");
    if (!node) {
      node = document.createElement("div");
      node.id = "assignments-ui-root";
      document.body.appendChild(node);
    }

    // Render React 18
    const root = ReactDOM.createRoot(node);
    root.render(<App />);
  }
};

export default plugin;

