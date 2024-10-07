import { createContext, useRef, useContext } from "react";
import { useSettings } from "./SettingsContext";

type VideoElementContext = {
  requestVideoElement: () => HTMLVideoElement | void;
  releaseVideoElement: (videoElement: HTMLVideoElement) => void;
};

const VideoElementContext = createContext<VideoElementContext>({
  requestVideoElement: () => undefined,
  releaseVideoElement: () => {},
});

class VideoElementPool {
  private pool: HTMLVideoElement[] = [];
  private createdCount = 0;

  constructor(private maxSize: number) {}

  private createElement = (): HTMLVideoElement => {
    const newElement = document.createElement("video");
    this.createdCount++;
    return newElement;
  };

  private freeElement = (element: HTMLVideoElement) => {
    element.pause();
    element.src = "";
    element.load();
    element.currentTime = 0;
    this.pool.push(element);
  };

  requestVideoElement = (): HTMLVideoElement | void => {
    if (this.pool.length > 0) {
      // console.log("  popped");

      const element = this.pool.pop()!;
      return element;
    }

    if (this.createdCount < this.maxSize) {
      // console.log("  created");

      const created = this.createElement();
      return created;
    }
  };

  releaseVideoElement = (element: HTMLVideoElement) => {
    // console.log("releaseVideoElement");
    this.freeElement(element);
  };
}

export const VideoElementProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { maxVideoElements } = useSettings();

  const videoElementPool = useRef(new VideoElementPool(maxVideoElements));

  return (
    <VideoElementContext.Provider value={videoElementPool.current}>
      {children}
    </VideoElementContext.Provider>
  );
};

export const useVideoElement = () => {
  return useContext(VideoElementContext);
};
