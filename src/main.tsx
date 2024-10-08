import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider } from "./contexts/SettingsContext";
import { LocalFileProvider } from "./localFile";
import { VideoElementProvider } from "./contexts/VideoElementContext";
import { FullscreenProvider } from "./contexts/FullscreenContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <SettingsProvider>
    <LocalFileProvider>
      <VideoElementProvider>
        <FullscreenProvider>
          <React.StrictMode>
            <App />
          </React.StrictMode>
        </FullscreenProvider>
      </VideoElementProvider>
    </LocalFileProvider>
  </SettingsProvider>,
);
