import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

import { FinalFile, type LocalFile } from "./types";
import { localFileToFinalFile } from "./localFile";
import { FinalFileCell } from "./FinalFileCell";

type LocalFileCellState =
  | { kind: "loading" }
  | { kind: "loaded"; files: FinalFile };

const localFileCache: Record<string, LocalFile> = {};

const getLocalFile = async (path: string) => {
  if (localFileCache[path]) {
    return localFileCache[path];
  }
  const file = await invoke("load_file", { path });
  localFileCache[path] = file as LocalFile;
  return localFileCache[path];
};

export function LocalFileCell({
  data,
  ...props
}: {
  data: LocalFile;
  index: number;
  width: number;
}) {
  const [state, setState] = useState<LocalFileCellState>({
    kind: "loading",
  });

  console.log("render", props);
  useEffect(() => {
    if (data.lazy) {
      getLocalFile(data.name).then((file) => {
        setState({ kind: "loaded", files: localFileToFinalFile(file) });
      });
    }
  }, [data]);
  switch (state.kind) {
    case "loading":
      return (
        <div
          style={{
            backgroundColor: "lightblue",
            height: "800px",
            width: "500px",
          }}
        >
          Local file
        </div>
      );
    case "loaded":
      return <FinalFileCell data={state.files} {...props} />;
  }
}
