import { useState, useEffect } from "react";

import { Gallery } from "./gallery/Gallery";
import { useSettings } from "./contexts/SettingsContext";
import { Settings } from "./settings/Settings";

import { type File } from "./types";

import "./App.css";
import { useLocalFiles } from "./localFile";

function WithSettings({}: {}) {
  const { glob } = useSettings();
  const [files, setFiles] = useState<File[]>([]);
  const {
    files: localFiles,
    loadFiles,
    loading: localFilesLoading,
  } = useLocalFiles();
  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    setFiles(localFiles);
  }, [localFiles]);
  return (
    <>
      <Gallery key={glob} loading={localFilesLoading} files={files} />
      <Settings />
    </>
  );
}

function App() {
  const { loading } = useSettings();

  return (
    <div style={{ position: "relative" }}>
      {loading ? <div>Loading settings</div> : <WithSettings />}
    </div>
  );
}

export default App;
