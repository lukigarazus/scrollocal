// import ReactPlayer from "react-player";
import { useMemo, useState, useEffect } from "react";

import { type FinalFile, calculateDimensions } from "../types";
import { useSettings } from "../contexts/SettingsContext";
import { Container } from "../components/Container";
import { useFullscreen } from "../contexts/FullscreenContext";

const VISIBILITY_THRESHOLD = 0.5;

type Props = {
  data: FinalFile;
  index: number;
  width: number;
  height: number;
  visibility?: number;
  videoElement?: HTMLVideoElement;
  onCellClick?: (id: string, videoElement?: HTMLVideoElement) => void;
  style?: React.CSSProperties;
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

const fixURL = (url: string) => {
  let newUrl = url;
  const isMP4 = url.endsWith(".mp4");
  if (isMP4) {
    newUrl = newUrl + "#t=0";
  }

  if (newUrl.match("scrolller")) newUrl = encodeURI(newUrl);

  return newUrl;
};

function Ok({
  data,
  width,
  playing,
  muted,
  visibility,
  setState,
  videoElement: externalVideoElement,
  onCellClick,
  style,
}: {
  data: FinalFile;
  width: number;
  playing: boolean;
  muted: boolean;
} & Props & { setState: React.Dispatch<React.SetStateAction<State>> }) {
  const { autoplay, showControlsInGalleryView } = useSettings();
  const { isFullscreen } = useFullscreen();
  // const { requestVideoElement, releaseVideoElement } = useVideoElement();

  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(
    null,
  );

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

  useEffect(() => {
    if (externalVideoElement) {
      const element = externalVideoElement;

      element.src = fixURL(data.src);
      element.muted = muted;
      element.controls = showControlsInGalleryView;
      element.autoplay = autoplay;
      element.loop = true;
      element.height = dimensions.height;
      element.width = dimensions.width;

      element.onerror = (error) => {
        setState((state) => ({
          ...state,
          kind: "error",
          error:
            typeof error === "string" ? new Error(error) : error.target.error,
        }));
      };

      if (playing) {
        element.play();
      }
      setVideoElement(element);
    }
  }, [externalVideoElement]);

  // useEffect(() => {
  //   if (!videoElement)
  //     requestVideoElement().then((element) => {
  //       element.src = data.src;
  //       element.muted = muted;
  //       element.controls = showControlsInGalleryView;
  //       element.autoplay = autoplay;
  //       element.loop = true;
  //       element.height = dimensions.height;
  //       element.width = dimensions.width;
  //
  //       element.onerror = (error) => {
  //         setState((state) => ({
  //           ...state,
  //           kind: "error",
  //           error:
  //             typeof error === "string" ? new Error(error) : error.target.error,
  //         }));
  //       };
  //
  //       if (playing) {
  //         element.play();
  //       }
  //       setVideoElement(element);
  //     });
  //   return () => {
  //     if (videoElement) releaseVideoElement(videoElement);
  //   };
  // }, [videoElement]);

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
    <div
      style={{ position: "relative", cursor: "pointer", ...style }}
      onClick={() => {
        onCellClick?.(data.name, videoElement ?? undefined);
      }}
    >
      {/* <div */}
      {/*   style={{ */}
      {/*     position: "absolute", */}
      {/*     zIndex: 1000, */}
      {/*   }} */}
      {/* > */}
      {/*   {data.name} */}
      {/* </div> */}
      {videoElement && !isFullscreen ? (
        <Container child={videoElement} />
      ) : (
        <div>Waiting for video element</div>
      )}

      {/* <ReactPlayer */}
      {/*   ref={videoRef} */}
      {/*   playing={playing} */}
      {/*   muted={muted} */}
      {/*   loop */}
      {/*   controls={showControlsInGalleryView} */}
      {/*   onPlay={() => setState((state) => ({ ...state, playing: true }))} */}
      {/*   onPause={() => setState((state) => ({ ...state, playing: false }))} */}
      {/*   onError={(error: any) => { */}
      {/*     console.error(error); */}
      {/*     setState({ */}
      {/*       kind: "error", */}
      {/*       error: error?.target?.error ?? "Unknown", */}
      {/*     }); */}
      {/*   }} */}
      {/*   url={data.src} */}
      {/*   width={dimensions.width} */}
      {/*   height={dimensions.height} */}
      {/*   stopOnUnmount */}
      {/* /> */}
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
  // useEffect(() => {
  //   const t = setTimeout(() => {
  //     setState((state) => ({ kind: "loading" }));
  //   }, 2000);
  //
  //   return () => {
  //     clearTimeout(t);
  //   };
  // }, []);
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
          padding: "5px",
          textWrap: "wrap",
        }}
      >
        <div>
          {error.message} {data.src}
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
  videoElement,
  ...props
}: Props) {
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
        playing: false,
        muted: true,
      }));
    }
  }, [state.kind]);

  if (state.kind === "error") {
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
      {...props}
      data={data}
      index={index}
      width={width}
      height={height}
      visibility={visibility}
      setState={setState}
      playing={state.kind === "ok" ? state.playing : false}
      muted={state.kind === "ok" ? state.muted : true}
      videoElement={videoElement}
    />
  );
}
