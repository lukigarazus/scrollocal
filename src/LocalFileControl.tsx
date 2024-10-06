import React, { useEffect, useState } from "react";

import { useLocalFiles } from "./localFile";
import { File } from "./types";

const persistGlob = (glob: string) => {
  localStorage.setItem("glob", glob);
};

const loadGlob = () => {
  return localStorage.getItem("glob");
};

export function LocalFileControl({
  setFiles,
}: {
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const { files, loadFiles: loadFile, error } = useLocalFiles();
  const [glob, setGlob] = useState("");

  useEffect(() => setFiles(files), [files]);
  useEffect(() => {
    const glob = loadGlob();
    if (glob) {
      setGlob(glob);
      loadFile(glob);
    }
  }, []);
  return (
    <div
      style={{
        display: "flex",
        gap: "5px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <input value={glob} onChange={(e) => setGlob(e.target.value)} />
      <button
        onClick={() => {
          loadFile(glob);
          persistGlob(glob);
        }}
      >
        Load
      </button>
      <span>Loaded {files.length} files</span>
      <span>Error {error?.message ?? "none"}</span>
    </div>
  );
}
