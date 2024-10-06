import { useState } from "react";

import { FinalFile, type LocalFile } from "../types";
import { FinalFileCell } from "./FinalFileCell";
import { localFileToFinalFile } from "../localFile";

type LocalFileCellState =
  | { kind: "loading" }
  | { kind: "loaded"; file: FinalFile; fromCache: boolean }
  | { kind: "error"; error: Error };

const Placeholder = ({
  width,
  height,
  text = "Local file",
}: {
  data: LocalFile;
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
  ...props
}: {
  data: LocalFile;
  index: number;
  height: number;
  width: number;
  visibility?: number;
}) {
  const [state, setState] = useState<LocalFileCellState>({
    kind: "loaded",
    fromCache: false,
    file: localFileToFinalFile(data),
  });

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
