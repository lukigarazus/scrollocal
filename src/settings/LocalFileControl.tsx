import { useCallback, useEffect, useState } from "react";
import { useLocalFeed } from "../contexts/LocalFeedContext/LocalFeedContext";

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
  const { glob, setGlob, loadGlobFiles } = useLocalFeed();
  const [localGlob, setLocalGlob] = useState<string | null>(glob);
  const [state, setState] = useState<State>({ kind: "idle" });

  const react = useCallback(() => {
    setState({ kind: "loading" });
    loadGlobFiles()
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
      <input
        placeholder={"Folder path"}
        value={localGlob || undefined}
        onChange={(e) => setLocalGlob(e.target.value)}
      />
      <button
        onClick={() => {
          setGlob(localGlob);
          react();
        }}
      >
        Load folder
      </button>
      {state.kind === "loading" && <div>Loading...</div>}
      {state.kind === "error" && <div>Error: {state.error.message}</div>}
    </div>
  );
}
