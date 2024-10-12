import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { SettingsProvider } from "./contexts/SettingsContext";
import { VideoElementProvider } from "./contexts/VideoElementContext";
import { FullscreenProvider } from "./contexts/FullscreenContext";
import { TagProvider } from "./contexts/TagContext";
import { HotkeysProvider } from "react-hotkeys-hook";
import { LocalFeedProvider } from "./contexts/LocalFeedContext/LocalFeedContext";
import { FeedProvider } from "./contexts/FeedContext";
import { FilterProvider } from "./contexts/FilterContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <SettingsProvider>
    <TagProvider>
      <FilterProvider>
        <FeedProvider>
          <LocalFeedProvider>
            <VideoElementProvider>
              <FullscreenProvider>
                <HotkeysProvider>
                  <React.StrictMode>
                    <App />
                  </React.StrictMode>
                </HotkeysProvider>
              </FullscreenProvider>
            </VideoElementProvider>
          </LocalFeedProvider>
        </FeedProvider>
      </FilterProvider>
    </TagProvider>
  </SettingsProvider>,
);
