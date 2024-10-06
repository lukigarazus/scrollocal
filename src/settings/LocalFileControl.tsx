import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

import { useLocalFiles } from "../localFile";
import { File } from "../types";
import { useSettings } from "../contexts/SettingsContext";

export function LocalFileControl({
  setFiles,
}: {
  setFiles: (files: File[]) => void;
}) {
  const { files, loadFiles, error } = useLocalFiles();
  const { glob, setGlob } = useSettings();

  const [localGlob, setLocalGlob] = useState<string>(glob);

  useEffect(() => setFiles(files), [files]);
  useEffect(() => {
    if (glob !== localGlob) return;

    invoke("clean_data_dir").then(() => {
      invoke("move_files_to_data_dir", { path: glob })
        .then((res) => {
          console.log("ok", res);
          loadFiles();
        })
        .catch(console.error);
    });
  }, [glob]);

  return (
    <div
      style={{
        display: "flex",
        gap: "5px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <input value={localGlob} onChange={(e) => setLocalGlob(e.target.value)} />
      <button onClick={() => setGlob(localGlob)}>Load folder</button>
      <span>Loaded {files.length} files</span>
      <span>Error {error?.message ?? "none"}</span>
    </div>
  );
}
