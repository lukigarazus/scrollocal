import { type FinalFile } from "./types";

export function FinalFileCell({
  data,
  width,
}: {
  data: FinalFile;
  index: number;
  width: number;
}) {
  return (
    <div
      style={{
        backgroundColor: "red",
        height: "800px",
        width: "500px",
      }}
    >
      <video muted autoPlay src={data.src} height={800} width={width} />
    </div>
  );
}
