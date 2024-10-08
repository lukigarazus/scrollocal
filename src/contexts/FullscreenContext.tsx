import {
  createContext,
  useCallback,
  useState,
  useContext,
  useEffect,
} from "react";
import ReactModal from "react-modal";
import { Container } from "../components/Container";

import { useBoundingClientRect } from "../useBoundingClientRef";

const FullscreenContext = createContext<{
  isFullscreen: boolean;
  requestFullscreen: (videoElement: HTMLVideoElement) => void;
  exitFullscreen: (videoElement: HTMLVideoElement) => void;
}>({
  isFullscreen: false,
  requestFullscreen: () => {},
  exitFullscreen: () => {},
});

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

  const [currentElement, setCurrentElement] = useState<null | HTMLVideoElement>(
    null,
  );
  const [oldDimensions, setOldDimensions] = useState<null | {
    width: number;
    height: number;
  }>(null);
  const [unloading, setUnloading] = useState(false);

  const syncDimensions = useCallback(
    (element: HTMLVideoElement) => {
      element.height = divRect?.height ?? 0;
      element.width = divRect?.width ?? 0;
    },
    [divRect],
  );

  const requestFullscreen = useCallback((videoElement: HTMLVideoElement) => {
    setOldDimensions({
      width: videoElement.width,
      height: videoElement.height,
    });
    syncDimensions(videoElement);
    setCurrentElement(videoElement);
  }, []);

  useEffect(() => {
    if (currentElement) {
      syncDimensions(currentElement);
    }
  }, [divRect]);

  useEffect(() => {
    if (unloading && currentElement) {
      if (oldDimensions) {
        currentElement.width = oldDimensions.width;
        currentElement.height = oldDimensions.height;
        setOldDimensions(null);
      }
      setCurrentElement(null);
      setUnloading(false);
    }
  }, [unloading]);

  return (
    <FullscreenContext.Provider
      value={{
        isFullscreen: currentElement !== null,
        requestFullscreen,
        exitFullscreen: () => setUnloading(true),
      }}
    >
      {children}
      {!unloading && (
        <ReactModal
          isOpen={currentElement !== null}
          onRequestClose={() => setUnloading(true)}
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
            <Container child={currentElement!} />
          </div>
        </ReactModal>
      )}
    </FullscreenContext.Provider>
  );
};

export const useFullscreen = () => {
  return useContext(FullscreenContext);
};
