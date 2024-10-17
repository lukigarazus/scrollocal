import { useState, useRef } from "react";
import { FilePicker } from "../components/FilePicker";
import {
  convertFilePathToFileSrc,
  moveFileToAssets,
  snipLocalFile,
} from "../contexts/LocalFeedContext/localFiles";
import { Container } from "../components/Container";
import { useHotkeys } from "react-hotkeys-hook";

type Snip = {
  id: string;
  from: string;
  to: string;
  done: boolean;
  name: string;
  loading?: boolean;
};

type Settings = {
  shouldSavetoGallery?: boolean;
};
type CommonState = {
  currentVideoSrc?: string;
  currentVideoOriginalPath?: string;
  settings: Settings;
};

type LoadingVideoState = { kind: "loading-video" } & CommonState;
type IdleState = { kind: "idle" } & CommonState;
type VideoLoadedState = { kind: "video-loaded" } & CommonState;

type State = LoadingVideoState | IdleState | VideoLoadedState;
type StateFragment = { state: State; setState: (state: State) => void };

export const VideoEditor = () => {
  const videoElement = useRef<HTMLVideoElement>(
    document.createElement("video"),
  );
  const [state, setState] = useState<State>({ kind: "idle", settings: {} });
  const [snips, setSnips] = useState<Snip[]>([]);
  const [activeSnip, setActiveSnip] = useState<string | null>(null);

  useHotkeys(
    "n",
    () => {
      const aSnip = snips.find((s) => s.id === activeSnip);
      if (!((+aSnip?.to && +aSnip?.from) || !aSnip)) {
        return;
      }
      if (aSnip && !aSnip.name) {
        aSnip.name = String(Date.now());
      }
      const id = String(Date.now());
      const newSnip = { id, from: "0", to: "0", done: false, name: "" };

      setSnips((oldSnips) => [newSnip, ...oldSnips]);

      setActiveSnip(id);
    },
    [snips, activeSnip],
  );
  useHotkeys(
    "s",
    () => {
      if (!activeSnip || snips.find((s) => s.id === activeSnip)?.done) {
        return;
      }

      setSnips((oldSnips) =>
        oldSnips.map((s) => {
          if (s.id === activeSnip) {
            return { ...s, from: videoElement.current.currentTime.toString() };
          }
          return s;
        }),
      );
    },
    [snips, activeSnip],
  );
  useHotkeys(
    "e",
    () => {
      const aSnip = snips.find((s) => s.id === activeSnip);
      if (!activeSnip || aSnip?.done || !+aSnip?.from) {
        return;
      }

      setSnips((oldSnips) =>
        oldSnips.map((s) => {
          if (s.id === activeSnip) {
            return { ...s, to: videoElement.current.currentTime.toString() };
          }
          return s;
        }),
      );
    },
    [snips, activeSnip],
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <div>
          <VideoContainer
            videoElement={videoElement.current}
            state={state}
            setState={setState}
          />
        </div>
        <div>
          <SnipsContainer
            state={state}
            setState={setState}
            snips={snips}
            setSnips={setSnips}
            activeSnip={activeSnip}
            setActiveSnip={setActiveSnip}
          />
        </div>
        <div>
          <SettingsContainer state={state} setState={setState} />
        </div>
      </div>
    </div>
  );
};

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${hours}:${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const SingleSnip = ({
  id,
  from,
  to,
  done,
  name,
  loading,
  setSnip,
  isActive,
  state,
}: Snip & {
  isActive: boolean;
  setSnip: (snip: Snip) => void;
} & StateFragment) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: `1px solid ${isActive ? "gold" : "black"}`,
        padding: "5px",
        margin: "5px",
      }}
    >
      <input
        disabled={loading || done}
        type="text"
        value={name}
        onChange={(e) => {
          const snip = { id, from, to, done, name: e.target.value };
          setSnip(snip);
        }}
      />
      <span>
        {formatDuration(+from)} - {formatDuration(+to)}
      </span>
      <span>{loading ? "loading..." : done ? "done" : "not created"}</span>
      <button
        disabled={done || loading || isActive || !name}
        onClick={() => {
          setSnip({ id, from, to, done: false, name, loading: true });
          snipLocalFile(
            state.currentVideoOriginalPath!,
            name,
            from!,
            String(+to! - +from!),
            state.settings.shouldSavetoGallery,
          )
            .then((res) => {
              setSnip({ id, from, to, done: true, name, loading: false });
            })
            .catch(() => {
              setSnip({ id, from, to, done: false, name, loading: false });
            });
        }}
      >
        Create
      </button>
    </div>
  );
};

const SnipsContainer = ({
  state,
  setState,
  snips,
  setSnips,
  activeSnip,
  setActiveSnip,
}: {
  state: State;
  setState: (state: State) => void;
  snips: Snip[];
  setSnips: (snips: Snip[]) => void;
  activeSnip: string | null;
  setActiveSnip: (activeSnip: string | null) => void;
}) => {
  return (
    <div>
      {snips.map((snip) => (
        <SingleSnip
          state={state}
          setState={setState}
          key={snip.id}
          {...snip}
          isActive={activeSnip === snip.id}
          setSnip={(snip) => {
            setSnips(
              snips.map((s) => {
                if (s.id === snip.id) {
                  return snip;
                }
                return s;
              }),
            );
          }}
        />
      ))}
    </div>
  );
};

const VideoContainer = ({
  state,
  setState,
  videoElement,
}: StateFragment & { videoElement: HTMLVideoElement }) => {
  switch (state.kind) {
    case "idle":
      return (
        <div>
          <FilePicker
            text="Open video"
            onSelect={(files) => {
              if (files.length > 1) {
                return;
              }

              setState({ ...state, kind: "loading-video" });

              moveFileToAssets(files[0]).then((newPath) => {
                // const httpPath = convertFilePathToHttpSrc(
                //   newPath as string,
                //   port!,
                // );
                const streamPath = convertFilePathToFileSrc(
                  newPath as string,
                  "stream",
                );

                videoElement.src = streamPath;

                videoElement.onerror = () => {
                  setState({ ...state, kind: "idle" });
                  videoElement.src = "";
                  videoElement.load();
                };

                videoElement.width = 720;
                videoElement.height = 480;
                videoElement.controls = true;

                setState({
                  ...state,
                  kind: "video-loaded",
                  currentVideoSrc: streamPath,
                  currentVideoOriginalPath: newPath as string,
                });
              });
            }}
          />
        </div>
      );
    case "loading-video":
      return <div>Loading</div>;
    case "video-loaded":
      return <Container child={videoElement} />;
    default:
      return <div>video</div>;
  }
};

const parseNumberWithDefault = (
  value: string | undefined,
  defaultValue: number,
) => {
  if (!value) {
    return defaultValue;
  }
  const parsed = +value;
  return isNaN(parsed) ? undefined : parsed;
};

const SettingsContainer = ({ state, setState }: StateFragment) => {
  function onSettingsChange<Key extends keyof Settings>(
    key: Key,
    value: Settings[Key],
  ) {
    setState({
      ...state,
      settings: {
        ...state.settings,
        [key]: value,
      },
    });
  }
  return (
    <div>
      <div>
        <label htmlFor="shouldSavetoGallery">Save to gallery</label>
        <input
          id="shouldSavetoGallery"
          type="checkbox"
          checked={state.settings.shouldSavetoGallery}
          onChange={() =>
            onSettingsChange(
              "shouldSavetoGallery",
              !state.settings.shouldSavetoGallery,
            )
          }
        />
      </div>
    </div>
  );
};
