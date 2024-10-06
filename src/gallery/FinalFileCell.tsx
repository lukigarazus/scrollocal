import ReactPlayer from "react-player";
import { useMemo, useState, useEffect } from "react";

import { type FinalFile, calculateDimensions } from "../types";
import { useSettings } from "../contexts/SettingsContext";

const VISIBILITY_THRESHOLD = 0.5;

type Props = {
  data: FinalFile;
  index: number;
  width: number;
  visibility?: number;
};

type State =
  | {
      kind: "ok";
      playing: boolean;
      muted: boolean;
    }
  | {
      kind: "error";
      error: Error;
    }
  | {
      kind: "loading";
    };

function Ok({
  data,
  width,
  playing,
  muted,
  visibility,
  setState,
}: {
  data: FinalFile;
  width: number;
  playing: boolean;
  muted: boolean;
} & Props & { setState: React.Dispatch<React.SetStateAction<State>> }) {
  const { autoplay, showControlsInGalleryView } = useSettings();
  const dimensions = useMemo(
    () => calculateDimensions(data.dimensions, width),
    [data, width],
  );

  useEffect(() => {
    if ((visibility ?? 0) > VISIBILITY_THRESHOLD && autoplay && !playing) {
      setState((state) => ({ ...state, playing: true }));
    } else if ((visibility ?? 0) < VISIBILITY_THRESHOLD && playing) {
      setState((state) => ({ ...state, playing: false }));
    }
  }, [width, visibility, autoplay]);
  if (!data.src)
    return (
      <div
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: "flex",
          backgroundColor: "red",
        }}
      />
    );
  return (
    <div style={{}}>
      {/* <video muted autoPlay src={data.src} width={width} /> */}
      <ReactPlayer
        playing={playing}
        muted={muted}
        loop
        controls={showControlsInGalleryView}
        onPlay={() => setState((state) => ({ ...state, playing: true }))}
        onPause={() => setState((state) => ({ ...state, playing: false }))}
        onError={(error: any) =>
          setState({
            kind: "error",
            error: error.target.error,
          })
        }
        url={data.src}
        width={dimensions.width}
        height={dimensions.height}
        stopOnUnmount
      />
    </div>
  );
}

function Error({
  error,
  width,
  height,
  setState,
  data,
}: {
  data: FinalFile;
  error: Error;
  width: number;
  height: number;
  setState: React.Dispatch<React.SetStateAction<State>>;
}) {
  useEffect(() => {
    const t = setTimeout(() => {
      setState((state) => ({ kind: "loading" }));
    }, 2000);

    return () => {
      clearTimeout(t);
    };
  }, []);
  return (
    <div
      style={{
        width,
        height,
        border: "1px solid red",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <div>
          {error.message} {data.name}
        </div>
        {error instanceof MediaError && <div>Retrying...</div>}
      </div>
    </div>
  );
}

export function FinalFileCell({
  data,
  width,
  height,
  visibility,
  index,
}: {
  data: FinalFile;
  index: number;
  width: number;
  height: number;
  visibility?: number;
}) {
  const { autoplay } = useSettings();
  const [state, setState] = useState<State>({
    kind: "ok",
    playing: (visibility ?? 0) > VISIBILITY_THRESHOLD && autoplay,
    muted: true,
  });

  useEffect(() => {
    if (state.kind === "loading") {
      setState((state) => ({
        kind: "ok",
        playing: (visibility ?? 0) > VISIBILITY_THRESHOLD && autoplay,
        muted: true,
      }));
    }
  }, [state.kind]);

  if (state.kind === "error") {
    console.log(state);
    return (
      <Error
        data={data}
        setState={setState}
        error={state.error}
        width={width}
        height={height}
      />
    );
  }

  return (
    <Ok
      data={data}
      index={index}
      width={width}
      visibility={visibility}
      setState={setState}
      playing={state.kind === "ok" ? state.playing : false}
      muted={state.kind === "ok" ? state.muted : true}
    />
  );
}
