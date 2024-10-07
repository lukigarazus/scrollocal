import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api";

import { useLocalFiles } from "../localFile";
import { useSettings } from "../contexts/SettingsContext";

type State =
  | {
      kind: "idle";
    }
  | {
      kind: "loading";
    }
  | {
      kind: "error";
      error: Error;
    };

export function LocalFileControl({}: {}) {
  const { loadFiles } = useLocalFiles();
  const { glob, setGlob } = useSettings();

  const [localGlob, setLocalGlob] = useState<string>(glob);
  const [state, setState] = useState<State>({ kind: "idle" });

  const react = useCallback((glob: string) => {
    setState({ kind: "loading" });

    invoke("clean_data_dir")
      .then(() => {
        return invoke("move_files_to_data_dir", { path: glob });
      })
      .then((res) => {
        return loadFiles();
      })
      .then(() => {
        setState({ kind: "idle" });
      })
      .catch((err) => {
        setState({ kind: "error", error: err });
      });
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
      <input value={localGlob} onChange={(e) => setLocalGlob(e.target.value)} />
      <button
        onClick={() => {
          setGlob(localGlob);
          react(localGlob);
        }}
      >
        Load folder
      </button>
      {state.kind === "loading" && <div>Loading...</div>}
      {state.kind === "error" && <div>Error: {state.error.message}</div>}
    </div>
  );
}
