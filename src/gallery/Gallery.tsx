import { type File } from "../types";
import { LocalFileCell } from "./LocalFileCell";
// import { useSettings } from "../contexts/SettingsContext";
import Scroll from "../scroll/Scroll";
import { useCallback, useRef } from "react";

function renderCell({
  index,
  data,
  width,
  height,
  ...props
}: {
  index: number;
  data: File;
  width: number;
  height: number;
  visibility?: number;
}) {
  switch (data.type) {
    case "local":
      return (
        <LocalFileCell
          {...props}
          data={data}
          index={index}
          height={height}
          width={width}
        />
      );
    default:
      return <div>Unhandled type: {data.type}</div>;
  }
}

export function Gallery({ files }: { files: File[] }) {
  // const { bufferSize } = useSettings();

  const currentIndex = useRef(0);
  const getNextElement = useCallback(() => {
    const element = files[currentIndex.current];
    if (!element) {
      return Promise.resolve(null);
    }
    currentIndex.current = currentIndex.current + 1;
    return Promise.resolve({
      data: element,
      height: element.dimensions?.height ?? 0,
      width: element.dimensions?.width ?? 0,
      id: element.name,
    });
  }, [files]);

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        boxSizing: "border-box",
        border: "1px solid grey",
        overflow: "hidden",
      }}
    >
      {files.length ? (
        <Scroll
          columns={3}
          rowGutter={8}
          columnGutter={8}
          onScroll={() => {}}
          /* @ts-ignore */
          renderElement={renderCell}
          overscanByPixels={500}
          getNextElement={getNextElement}
        />
      ) : (
        <div>Nothing to show</div>
      )}
    </div>
  );
}
