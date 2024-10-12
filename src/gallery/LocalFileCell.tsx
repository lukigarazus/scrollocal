import { useState } from "react";

import { FinalFile, type LocalFile } from "../types";
import { FinalFileCell } from "./FinalFileCell";

type LocalFileCellState =
  | { kind: "loading" }
  | { kind: "loaded"; file: FinalFile<LocalFile>; fromCache: boolean }
  | { kind: "error"; error: Error };

const Placeholder = ({
  width,
  height,
  text = "Local file",
}: {
  data: FinalFile<LocalFile>;
  height: number;
  width: number;
  text?: string;
}) => {
  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        border: "1px solid gray",
      }}
    >
      {text}
    </div>
  );
};

export function LocalFileCell({
  data,
  width,
  height,
  onCellClick,
  ...props
}: {
  data: FinalFile<LocalFile>;
  index: number;
  height: number;
  width: number;
  visibility?: number;
  videoElement?: HTMLVideoElement;
  onCellClick?: (id: string, videoElement?: HTMLVideoElement) => void;
}) {
  const [state, setState] = useState<LocalFileCellState>({
    kind: "loaded",
    fromCache: false,
    file: data,
  });

  // useEffect(() => {
  //   if (data.lazy) {
  //     loadLocalFile(data.name)
  //       .then(([file, fromCache]) => {
  //         file.dimensions = data.dimensions;
  //         setState({
  //           kind: "loaded",
  //           file: localFileToFinalFile(file),
  //           fromCache,
  //         });
  //       })
  //       .catch((err) => {
  //         setState({ kind: "error", error: err });
  //       });
  //   }
  // }, [data]);
  switch (state.kind) {
    case "loading": {
      return (
        <Placeholder
          data={data}
          width={width}
          height={height}
          text="Loading local file"
        />
      );
    }
    case "loaded":
      return (
        <FinalFileCell
          data={state.file}
          width={width}
          height={height}
          onCellClick={onCellClick}
          {...props}
        />
      );
    case "error":
      return (
        <Placeholder
          data={data}
          width={width}
          height={height}
          text={`${state.error.message} for ${data.name}`}
        />
      );
  }
}
