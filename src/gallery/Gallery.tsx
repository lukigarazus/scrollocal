import { useCallback, useEffect, useRef, useState } from "react";

import { LocalFile, type FinalFile } from "../types";
import { LocalFileCell } from "./LocalFileCell";
import Scroll from "../scroll/Scroll";
import { useFeed } from "../contexts/FeedContext";
import { useFilter } from "../contexts/FilterContext";
import { useFullscreen } from "../contexts/FullscreenContext";
import { ScrollElement } from "../scroll/utils";
import { FeedResult, FeedState } from "../feed/Feed";

export function Gallery({}: {}) {
  const { feed } = useFeed();
  const [feedState, setFeedState] = useState<FeedState>(feed.state);
  const galleryElementsRef = useRef<ScrollElement[]>([]);
  const [galleryElements, setGalleryElements] = useState<ScrollElement[]>([]);
  const { asString } = useFilter();
  const { requestFullscreen, requestGalleryFullscreen } = useFullscreen();

  const getNextElement = useCallback((): Promise<ScrollElement | null> => {
    switch (feed.state) {
      case "ok": {
        return feed.getNext().then((result: FeedResult<FinalFile<unknown>>) => {
          switch (result.kind) {
            case "ok": {
              const file = result.value;
              const res = {
                data: file,
                height: file.dimensions?.height ?? 0,
                width: file.dimensions?.width ?? 0,
                id: file.name,
                dataSrc: file.src,
              } satisfies ScrollElement;
              setGalleryElements((prev) => [...prev, res]);
              galleryElementsRef.current = [...galleryElementsRef.current, res];
              return res;
            }
            case "error": {
              return null;
            }
            case "none": {
              return null;
            }
          }
        });
      }
      case "loading": {
        return new Promise((res) => {
          const callback = (_: FeedState, newState: FeedState) => {
            if (newState === "ok") {
              res(getNextElement());
              feed.stopListeningForChanges(callback);
            } else {
              res(null);
            }
          };
          feed.listenForChanges(callback);
        });
      }
      default:
        return Promise.resolve(null);
    }
  }, [feed]);

  const onCellClick = useCallback(
    (id: string, videoElement?: HTMLVideoElement) => {
      if (videoElement) {
        requestGalleryFullscreen({
          getNext: async (currentId) => {
            const currentIndex = galleryElementsRef.current.findIndex(
              (element) => currentId === element.id,
            );
            console.log(currentId, currentIndex, galleryElementsRef.current);

            if (currentIndex < galleryElementsRef.current.length - 1) {
              return galleryElementsRef.current[currentIndex + 1];
            } else {
              return getNextElement();
            }
          },
          getPrevious: async (currentId) => {
            const currentIndex = galleryElementsRef.current.findIndex(
              (element) => currentId === element.id,
            );
            if (currentIndex > 0) {
              return galleryElementsRef.current[currentIndex - 1];
            } else {
              return null;
            }
          },
          current: { id, videoElement },
        });
      }
    },
    [galleryElements],
  );

  const renderCell = useCallback(
    ({
      index,
      data,
      width,
      height,
      ...props
    }: {
      index: number;
      data: FinalFile;
      width: number;
      height: number;
      visibility?: number;
    }) => {
      switch (data.type) {
        case "local":
          return (
            <LocalFileCell
              {...props}
              data={data as FinalFile<LocalFile>}
              index={index}
              height={height}
              width={width}
              onCellClick={onCellClick}
            />
          );
        default:
          return <div>Unhandled type: {data.type}</div>;
      }
    },
    [onCellClick],
  );

  useEffect(() => {
    setGalleryElements([]);
    const callback = (_: FeedState, newState: FeedState) => {
      setFeedState(newState);
    };
    feed.listenForChanges(callback);
    return () => {
      feed.stopListeningForChanges(callback);
    };
  }, [feed]);
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        border: "1px solid grey",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {feedState === "ok" || feedState === "exhausted" ? (
        <Scroll
          exhausted={feed.state === "exhausted"}
          elements={galleryElements}
          key={asString}
          columns={3}
          rowGutter={8}
          columnGutter={8}
          onScroll={() => {}}
          /* @ts-ignore */
          renderElement={renderCell}
          overscanBy={2}
          signalMore={getNextElement}
        />
      ) : feedState === "loading" ? (
        <div>Loading...</div>
      ) : (
        <div>No active feeds, go to settings</div>
      )}
    </div>
  );
}
