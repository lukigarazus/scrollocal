import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import ReactModal from "react-modal";
import { Container } from "../components/Container";

import { useBoundingClientRect } from "../useBoundingClientRef";
import { useTags } from "./TagContext";
import { useHotkeys } from "react-hotkeys-hook";

const FullscreenContext = createContext<{
  isFullscreen: boolean;
  requestFullscreen: (payload: {
    id: string;
    videoElement: HTMLVideoElement;
  }) => void;
  exitFullscreen: (payload: {
    id: string;
    videoElement: HTMLVideoElement;
  }) => void;
  requestGalleryFullscreen: (payload: {
    getNext: (currentId: string) => Promise<GalleryElement | null>;
    getPrevious: (currentId: string) => Promise<GalleryElement | null>;
    current: GalleryElement;
  }) => void;
}>({
  isFullscreen: false,
  requestFullscreen: () => {},
  requestGalleryFullscreen: () => {},
  exitFullscreen: () => {},
});

type GalleryElement = {
  videoElement?: HTMLVideoElement;
  dataSrc?: string;
  id: string;
};

type FullscreenState =
  | {
      kind: "idle";
    }
  | {
      kind: "fullscreen";
      id: string;
      videoElement: HTMLVideoElement;
      oldAttributes?: {
        width: number;
        height: number;
        controls: boolean;
      };
    }
  | {
      kind: "unloading";
      galleryNext?: boolean;
      videoElement: HTMLVideoElement;
      oldAttributes?: { width: number; height: number; controls: boolean };
    };

export const FullscreenProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    rect: divRect,
    setRef: setDivRef,
    ref: divRef,
  } = useBoundingClientRect();
  const { tags, assignTag } = useTags();

  const fullscreenVideoElement = useRef<HTMLVideoElement>(
    document.createElement("video"),
  );

  const [state, setState] = useState<FullscreenState>({ kind: "idle" });
  const [currentGallery, setCurrentGallery] = useState<null | {
    getNext: (currentId: string) => Promise<GalleryElement | null>;
    getPrevious: (currentId: string) => Promise<GalleryElement | null>;
    current: GalleryElement;
  }>(null);

  useHotkeys(
    tags.map((tag) => tag.hotkey!).filter(Boolean),
    (e, hk) => {
      if (state.kind === "fullscreen") {
        const activatedTag = tags.find(
          (tag) => tag.hotkey === hk.keys?.join("+"),
        );

        if (activatedTag && state.id) {
          assignTag(state.id, activatedTag);
        }
      }
    },
    {
      scopes: "tags",
    },
    [state],
  );
  useHotkeys(
    "up",
    () => {
      if (state.kind === "fullscreen") {
        if (currentGallery && state.id) {
          currentGallery.getPrevious(state.id).then((element) => {
            if (element) {
              requestGalleryFullscreen({
                getNext: currentGallery.getNext,
                getPrevious: currentGallery.getPrevious,
                current: element,
              });
            }
          });
        }
      }
    },
    [currentGallery, state],
  );
  useHotkeys(
    "down",
    () => {
      if (state.kind === "fullscreen") {
        if (currentGallery && state.id) {
          currentGallery.getNext(state.id).then((element) => {
            console.log("next fullscrenn element", element);
            if (element) {
              requestGalleryFullscreen({
                getNext: currentGallery.getNext,
                getPrevious: currentGallery.getPrevious,
                current: element,
              });
            }
          });
        }
      }
    },
    [currentGallery, state],
  );

  const syncDimensions = useCallback(
    (element: HTMLVideoElement) => {
      element.height = divRect?.height ?? 0;
      element.width = divRect?.width ?? 0;
    },
    [divRect],
  );

  const requestFullscreen = useCallback(
    ({ id, videoElement }: { id: string; videoElement: HTMLVideoElement }) => {
      const oldAttributes = {
        width: videoElement.width,
        height: videoElement.height,
        controls: videoElement.controls,
      };
      syncDimensions(videoElement);
      videoElement.controls = true;

      setState({
        kind: "fullscreen",
        id,
        videoElement,
        oldAttributes,
      });
    },
    [],
  );
  const requestGalleryFullscreen = useCallback(
    (gallery: {
      getNext: (currentId: string) => Promise<GalleryElement | null>;
      getPrevious: (currentId: string) => Promise<GalleryElement | null>;
      current: GalleryElement;
    }) => {
      setCurrentGallery(gallery);

      let videoElement: HTMLVideoElement;
      if (gallery.current.videoElement)
        videoElement = gallery.current.videoElement;

      if (gallery.current.dataSrc) {
        fullscreenVideoElement.current.src = gallery.current.dataSrc;
        fullscreenVideoElement.current.load();
        fullscreenVideoElement.current.controls = true;

        videoElement = fullscreenVideoElement.current;
      }
      if (state.kind === "fullscreen") {
        setState({
          kind: "unloading",
          galleryNext: true,
          videoElement: state.videoElement,
          oldAttributes: state.oldAttributes,
        });
      }

      if (state.kind === "unloading") {
        setState({
          kind: "unloading",
          galleryNext: true,
          videoElement: state.videoElement,
          oldAttributes: state.oldAttributes,
        });
      }

      if (state.kind === "idle") {
        requestFullscreen({
          id: gallery.current.id,
          // @ts-ignore
          videoElement,
        });
      }
    },
    [],
  );

  useEffect(() => {
    if (state.kind === "fullscreen" && state.videoElement) {
      syncDimensions(state.videoElement);
    }
  }, [divRect, state]);

  useEffect(() => {
    if (state.kind === "unloading") {
      if (state.oldAttributes) {
        const currentElement = state.videoElement;
        currentElement.width = state.oldAttributes.width;
        currentElement.height = state.oldAttributes.height;
        currentElement.controls = state.oldAttributes.controls;
      }
      if (state.galleryNext) {
        requestGalleryFullscreen(currentGallery!);
      } else {
        setState({ kind: "idle" });
      }
    }
  }, [state]);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen: state.kind === "fullscreen" || state.kind === "unloading",
        requestFullscreen,
        requestGalleryFullscreen,
        exitFullscreen: () => {
          if (state.kind === "fullscreen")
            setState({
              kind: "unloading",
              galleryNext: false,
              videoElement: state.videoElement,
            });
          else setState({ kind: "idle" });
        },
      }}
    >
      {children}

      <ReactModal
        isOpen={state.kind !== "idle"}
        onRequestClose={() => {
          if (state.kind === "fullscreen")
            setState({
              kind: "unloading",
              galleryNext: false,
              videoElement: state.videoElement,
            });
          else setState({ kind: "idle" });
        }}
        style={{
          content: {
            color: "#f6f6f6",
            backgroundColor: "#2f2f2f",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          },
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <div
          ref={(me) => setDivRef(me)}
          style={{ height: "100%", width: "100%" }}
        >
          {state.kind === "fullscreen" && (
            <Container child={state.videoElement} />
          )}
        </div>
      </ReactModal>
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  return useContext(FullscreenContext);
};
