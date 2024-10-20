import { useState, useRef, useEffect, useMemo } from "react";
import { FilePicker } from "../components/FilePicker";
import {
  convertFilePathToFileSrc,
  moveFileToAssets,
} from "../contexts/LocalFeedContext/localFiles";
import { Box } from "../components/Box";
import { SnipsContainer } from "./Snips";
import { VideoFullSize } from "../components/VideoFullsize";
import { Card } from "../components/Card";
import { useBoundingClientRect } from "../useBoundingClientRef";
import { VideoOverview } from "./VideoOverview";

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

  return (
    <div className="size-full grid gap-2 p-2 grid-cols-[2fr_5fr_1fr]">
      <Card>
        {state.currentVideoOriginalPath ? (
          <SnipsContainer
            videoElement={videoElement.current}
            videoPath={state.currentVideoOriginalPath}
            shouldSavetoGallery={state.settings.shouldSavetoGallery}
          />
        ) : (
          <Box>Pick a video</Box>
        )}
      </Card>
      <Card>
        <VideoContainer
          videoElement={videoElement.current}
          state={state}
          setState={setState}
        />
      </Card>
      <Card>
        <SettingsContainer
          videoElement={videoElement.current}
          state={state}
          setState={setState}
        />
      </Card>
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
      return <Box>No video</Box>;
    case "loading-video":
      return <Box>Loading...</Box>;
    case "video-loaded":
      return (
        <>
          <div className="grid grid-rows-[3fr_1fr] size-full">
            <VideoFullSize videoElement={videoElement} />
            <div>
              <VideoOverview videoElement={videoElement} />
            </div>
          </div>
        </>
      );
    default:
      return <Box>Something went wrong with the video</Box>;
  }
};

const SettingsContainer = ({
  state,
  setState,
  videoElement,
}: StateFragment & { videoElement: HTMLVideoElement }) => {
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
};
