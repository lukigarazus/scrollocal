import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider } from "./contexts/SettingsContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <SettingsProvider>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </SettingsProvider>,
);
