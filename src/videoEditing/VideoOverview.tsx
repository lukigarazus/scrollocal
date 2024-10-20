import { useState, useRef, useEffect, useCallback } from "react";
import { Box } from "../components/Box";
import { useBoundingClientRect } from "../useBoundingClientRef";
import { bruteForceSceneCuts, drawVideoOverviewToCanvas } from "./canvasUtils";

type SelectionState = {
  leftOffset: number;
  rightOffset: number;
  leftPercent: number;
  rightPercent: number;
};

export const VideoOverview = ({
  videoElement,
  partitions = 10,
}: {
  videoElement: HTMLVideoElement;
  partitions?: number;
  onSelectionChange?: (state: SelectionState) => void;
}) => {
  const { setRef, rect } = useBoundingClientRect();
  const canvas = useRef<HTMLCanvasElement>(document.createElement("canvas"));
  const compCanvas1 = useRef<HTMLCanvasElement>(
    document.createElement("canvas"),
  );
  const compCanvas2 = useRef<HTMLCanvasElement>(
    document.createElement("canvas"),
  );

  const [guessedCuts, setGuessedCuts] = useState<number[]>([]);
  const [selectionState, setSelectionState] = useState<SelectionState>({
    leftOffset: 0,
    rightOffset: 0,
    leftPercent: 0,
    rightPercent: 1,
  });

  const [draggingState, setDraggingState] = useState<
    { kind: "idle" } | { kind: "dragging"; side: "left" | "right" }
  >({
    kind: "idle",
  });

  useEffect(() => {
    if (rect?.height && rect?.width) {
      canvas.current.width = rect.width;
      canvas.current.height = 150;
    }
  }, [rect]);

  useEffect(() => {
    if (canvas.current) {
      const ctx = canvas.current.getContext("2d");
      if (ctx) {
        drawVideoOverviewToCanvas(
          videoElement,
          canvas.current,
          ctx,
          partitions,
        );
      }
    }
  }, [videoElement.src]);

  const findCuts = useCallback(() => {
    console.log("finding cuts");
    compCanvas1.current.width = videoElement.width;
    compCanvas1.current.height = videoElement.height;

    compCanvas2.current.width = videoElement.width;
    compCanvas2.current.height = videoElement.height;

    bruteForceSceneCuts(videoElement, compCanvas1.current, compCanvas2.current)
      .then(setGuessedCuts)
      .catch(console.error);
  }, [videoElement.src]);

  console.log(guessedCuts);
  return (
    <>
      <button onClick={findCuts}>Find Cuts</button>
      <Box
        setRef={setRef}
        className="relative select-none"
        onMouseMove={(e) => {
          if (draggingState.kind === "dragging") {
            const parent = e.currentTarget.parentElement!;
            const currentRightPosition =
              parent.clientWidth - selectionState.rightOffset;

            if (draggingState.side === "left") {
              const newValue = Math.min(
                currentRightPosition,
                Math.max(0, e.clientX - parent.offsetLeft),
              );
              const leftPercent = newValue / parent.clientWidth;
              videoElement.currentTime = videoElement.duration * leftPercent;
              setSelectionState({
                leftOffset: newValue,
                leftPercent,
                rightOffset: selectionState.rightOffset,
                rightPercent: selectionState.rightPercent,
              });
            } else {
              const newValue = Math.min(
                parent.clientWidth - selectionState.leftOffset,
                Math.max(0, parent.offsetLeft + parent.clientWidth - e.clientX),
              );
              const leftLeft = parent.clientWidth - newValue;
              const rightPercent = leftLeft / parent.clientWidth;
              videoElement.currentTime = videoElement.duration * rightPercent;
              setSelectionState({
                leftOffset: selectionState.leftOffset,
                leftPercent: selectionState.leftPercent,
                rightOffset: newValue,
                rightPercent,
              });
            }
          }
        }}
      >
        <div className="absolute size-full">
          {guessedCuts.map((c) => (
            <div
              key={c}
              className="absolute bg-red-500 w-1 h-full"
              style={{
                left: (rect?.width ?? 0) * (c / videoElement.duration),
              }}
            ></div>
          ))}
        </div>
        <div
          className="absolute border-white border-solid border-2 box-border"
          style={{
            left: selectionState.leftOffset,
            right: selectionState.rightOffset,
            top: 0,
            bottom: 0,
            width: `calc(100% - ${selectionState.leftOffset}px - ${selectionState.rightOffset}px)`,
          }}
        >
          <span
            onMouseDown={() =>
              setDraggingState({ kind: "dragging", side: "left" })
            }
            onMouseUp={() => setDraggingState({ kind: "idle" })}
            className="absolute left-0 top-[50%] translate-y-[-50%] translate-x-[-50%]"
          >
            <span className="border-white border-[10px] rounded-full border-solid cursor-pointer" />
          </span>
          <span
            onMouseDown={() =>
              setDraggingState({ kind: "dragging", side: "right" })
            }
            onMouseUp={() => setDraggingState({ kind: "idle" })}
            className="absolute right-0 top-[50%] translate-y-[-50%] translate-x-[50%]"
          >
            <span className="border-red-500 border-[10px] rounded-full border-solid cursor-pointer" />
          </span>
        </div>
        <canvas ref={canvas} />
        {/* <div> */}
        {/*   <div> */}
        {/*     <canvas ref={compCanvas1} /> */}
        {/*     <canvas ref={compCanvas2} /> */}
        {/*   </div> */}
        {/* </div> */}
      </Box>
    </>
  );
};
