import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";
import ReactModal from "react-modal";
import { useHotkeys } from "react-hotkeys-hook";
import { useSwipeable } from "react-swipeable";

import { Container } from "../components/Container";
import { useBoundingClientRect } from "../useBoundingClientRef";
import { useTags } from "./TagContext";

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
        autoplay: boolean;
      };
    }
  | {
      kind: "unloading";
      galleryNext?: boolean;
      videoElement: HTMLVideoElement;
      oldAttributes?: { width: number; height: number; controls: boolean };
    }
  | { kind: "" };

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
  const handleNavigation = useCallback(
    (dir: "up" | "down") => {
      if (state.kind === "fullscreen") {
        if (currentGallery && state.id) {
          currentGallery[dir === "up" ? "getPrevious" : "getNext"](
            state.id,
          ).then((element) => {
            if (element) {
              setCurrentGallery({
                getNext: currentGallery.getNext,
                getPrevious: currentGallery.getPrevious,
                current: element,
              });
              setState({
                ...state,
                kind: "unloading",
                galleryNext: true,
              });
            }
          });
        }
      }
    },
    [state, currentGallery],
  );
  useHotkeys(
    "up",
    () => {
      handleNavigation("up");
    },
    [currentGallery, state],
  );
  useHotkeys(
    "down",
    () => {
      handleNavigation("down");
    },
    [currentGallery, state],
  );
  useHotkeys("p", () => {
    if (state.kind === "fullscreen") {
      state.videoElement.play();
    }
  });
  const handlers = useSwipeable({
    onSwipedUp: () => handleNavigation("up"),
    onSwipedDown: () => handleNavigation("down"),
  });

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
        autoplay: videoElement.autoplay,
      };
      syncDimensions(videoElement);
      videoElement.controls = true;
      videoElement.autoplay = true;

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

      if (state.kind === "idle" || state.kind === "unloading") {
        requestFullscreen({
          id: gallery.current.id,
          // @ts-ignore
          videoElement,
        });
      }
    },
    [state],
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
        currentElement.autoplay = state.oldAttributes.autoplay;
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
          {...handlers}
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
