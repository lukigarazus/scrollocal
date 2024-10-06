import { useState, useEffect } from "react";

import { Gallery } from "./gallery/Gallery";
import { useSettings } from "./contexts/SettingsContext";
import { Settings } from "./settings/Settings";

import { type File } from "./types";

import "./App.css";
import { useLocalFiles } from "./localFile";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const { loading } = useSettings();
  const { files: localFiles, loadFiles } = useLocalFiles();

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    setFiles(localFiles);
  }, [localFiles]);

  return (
    <div style={{ position: "relative" }}>
      {loading ? (
        <div>Loading settings</div>
      ) : (
        <>
          <Gallery files={files} />
          <Settings setFiles={setFiles} />
        </>
      )}
    </div>
  );
}

export default App;
