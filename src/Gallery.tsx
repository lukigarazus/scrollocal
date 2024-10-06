import { Masonry } from "masonic";

import { type File } from "./types";
import { LocalFileCell } from "./LocalFileCell";

function renderCell({
  index,
  data,
  width,
}: {
  index: number;
  data: File;
  width: number;
}) {
  switch (data.type) {
    case "local":
      return <LocalFileCell data={data} index={index} width={width} />;
    default:
      return <div>Unhandled type: {data.type}</div>;
  }
}

export function Gallery({ files }: { files: File[] }) {
  return (
    <Masonry
      // Provides the data for our grid items
      items={files}
      // Adds 8px of space between the grid cells
      columnGutter={8}
      // Sets the minimum column width to 172px
      columnWidth={500}
      // Pre-renders 5 windows worth of content
      overscanBy={1}
      // This is the grid item component
      render={renderCell}
    ></Masonry>
  );
}
