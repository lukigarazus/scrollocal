import { throttle } from "lodash";
import {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { calculateDimensions } from "../types";
import { type ScrollElement, sumHeights } from "./utils";
import { useVideoElement } from "../contexts/VideoElementContext";
import { useBoundingClientRect } from "../useBoundingClientRef";

const SCROLL_DEBOUNCE = 0;
const CELL_RENDER_DEBOUNCE = 400;

function ScrollElement({
  width,
  height,
  index,
  data,
  renderElement,
  id,
  visibility,
  videoElement,
}: ScrollElement & {
  columnWidth: number;
  renderElement: (element: ScrollElement) => ReactNode;
}) {
  const [debounced, setDebounced] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(true);
    }, CELL_RENDER_DEBOUNCE);
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        border: !debounced ? "1px solid black" : "1px solid transparent",
      }}
    >
      {debounced
        ? renderElement({
            width,
            height,
            data,
            id,
            visibility,
            index,
            videoElement,
          })
        : null}
    </div>
  );
}

type ColumnProps = {
  elements: ScrollElement[];
  column: number;
  rowGutter: number;
  onScroll: (x: number, y: number) => void;
  signalMore: () => void;
  parentHeight: number;
  renderElement: (element: ScrollElement) => ReactNode;
  scrollTop: number;
  overscanBy: number;
  exhausted: boolean;
};

function Column({
  elements,
  rowGutter,
  signalMore,
  renderElement,
  scrollTop,
  parentHeight,
  overscanBy,
  exhausted,
}: ColumnProps) {
  const { rect, setRef } = useBoundingClientRect();
  const { requestVideoElement, releaseVideoElement } = useVideoElement();

  // const [exhausted, setExhausted] = useState(false);

  const visibleElementsSet = useRef(new Map<string, HTMLVideoElement | void>());

  const width = rect?.width ?? 0;

  const elementsWithDimensions = useMemo<ScrollElement[]>(() => {
    return elements
      .map((element) => {
        const dimensions = calculateDimensions(
          {
            width: element.width,
            height: element.height,
            aspect_ratio: "1:1",
          },
          width,
        );
        return {
          ...element,
          width: dimensions.width,
          height: dimensions.height,
        };
      })
      .filter((element) => !Number.isNaN(element.height));
  }, [elements, width]);

  const { visibleElements, topOffset, bottomOffset } = useMemo(() => {
    const start = Date.now();
    let firstVisibleFound = false;
    let overscanned = 0;
    const windowStartBase = scrollTop;
    const windowEndBase = windowStartBase + parentHeight;
    const windowStart = Math.max(windowStartBase, 0);
    const windowEnd = windowEndBase;
    let y = 0;
    const result: ScrollElement[] = [];

    const handleVisibleElement = (
      element: ScrollElement,
      startPosition: number,
      endPosition: number,
    ) => {
      // console.log(
      //   column,
      //   element.data,
      //   windowStart,
      //   windowEnd,
      //   startPosition,
      //   endPosition,
      // );

      result.push(element);
      element.visibility = Math.max(
        0,
        (Math.min(endPosition, windowEndBase) -
          Math.max(startPosition, windowStartBase)) /
          (endPosition - startPosition),
      );
      const wasNotVisibleBefore = !visibleElementsSet.current.has(element.id);
      if (wasNotVisibleBefore) {
        const videoElement = requestVideoElement();
        visibleElementsSet.current.set(element.id, videoElement);
        if (videoElement) element.videoElement = videoElement;
      } else {
        const videoElement = visibleElementsSet.current.get(element.id);
        if (videoElement) element.videoElement = videoElement;
      }
    };

    for (const element of elementsWithDimensions) {
      // if (!element.height) continue;

      const startPosition = y;
      const endPosition = y + element.height;

      const isReallyVisible = !(
        windowStart > endPosition || windowEnd < startPosition
      );
      const shouldOverscan =
        !isReallyVisible && firstVisibleFound && overscanned < overscanBy;
      if (isReallyVisible || shouldOverscan) {
        // console.log(
        //   "visible element",
        //   column,
        //   windowStart,
        //   windowEnd,
        //   startPosition,
        //   endPosition,
        //   element.data,
        // );
        if (shouldOverscan) {
          overscanned++;
        }
        if (!firstVisibleFound) firstVisibleFound = true;
        handleVisibleElement(element, startPosition, endPosition);
      } else {
        const wasVisibleBefore = visibleElementsSet.current.has(element.id);
        if (wasVisibleBefore) {
          visibleElementsSet.current.delete(element.id);
          if (element.videoElement) releaseVideoElement(element.videoElement);
        }
        if (firstVisibleFound && !wasVisibleBefore) break;
      }

      y += element.height + rowGutter;
    }

    const firstVisibleIndex = elementsWithDimensions.indexOf(result[0]);
    const lastVisibleIndex = elementsWithDimensions.indexOf(
      result[result.length - 1],
    );

    // const handleOverscanned = (startIndex: number) => {
    //   for (let i = startIndex; i < startIndex + overscanBy; i++) {
    //     const element = elementsWithDimensions[i];
    //     if (!element) continue;
    //     handleVisibleElement(element);
    //     y += element.height + rowGutter;
    //   }
    // };
    //
    // handleOverscanned(firstVisibleIndex);
    // handleOverscanned(lastVisibleIndex + 1);

    const beforeInvisible =
      firstVisibleIndex === -1
        ? []
        : elementsWithDimensions.slice(0, firstVisibleIndex);
    const afterInvisible =
      lastVisibleIndex === -1
        ? []
        : elementsWithDimensions.slice(lastVisibleIndex + 1);

    const topOffset = sumHeights(beforeInvisible, rowGutter);
    const bottomOffset = sumHeights(afterInvisible, rowGutter);

    const end = Date.now();
    // console.log("Recalc took", end - start, "ms");
    return { visibleElements: result, topOffset, bottomOffset };
  }, [elementsWithDimensions, scrollTop]);

  useEffect(() => {
    if (bottomOffset < 300 && !exhausted) {
      signalMore();
      // if (exhausted) return;
      // getNextElements(getNextElement, 1).then((elements) => {
      //   const hasNull = elements.includes(null);
      //   if (hasNull) setExhausted(true);
      //
      //   setElements((oldElements) => [
      //     ...oldElements,
      //     ...(elements.filter(Boolean) as ScrollElement[]),
      //   ]);
      // });
    }
  }, [bottomOffset, scrollTop]);

  // console.log(
  //   "visibleElements",
  //   visibleElements.length,
  //   document.querySelectorAll("video").length,
  // );
  return (
    <div style={{ position: "relative" }}>
      <div style={{ height: topOffset }} />
      <div
        ref={setRef}
        style={{
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          rowGap: rowGutter,
        }}
      >
        {visibleElements.map((element, i) => (
          <ScrollElement
            visibility={element.visibility}
            key={element.id}
            id={element.id}
            index={i}
            width={element.width}
            height={element.height}
            data={element.data}
            columnWidth={width}
            renderElement={renderElement}
            videoElement={element.videoElement}
          />
        ))}
        {exhausted && <div>I'm exhausted</div>}
      </div>
      <div style={{ height: bottomOffset }} />
    </div>
  );
}

type ScrollProps = {
  elements: ScrollElement[];
  columns: number;
  rowGutter: number;
  columnGutter: number;
  onScroll: (x: number, y: number) => void;
  signalMore: () => void;
  overscanBy?: number;
  renderElement: (element: ScrollElement) => ReactNode;
  onElementClick?: (id: string, videoElement?: HTMLVideoElement) => void;
  exhausted: boolean;
};

export default function Scroll({
  elements,
  columns,
  rowGutter,
  columnGutter,
  signalMore,
  overscanBy = 1,
  renderElement,
  exhausted,
}: ScrollProps) {
  const { rect, setRef } = useBoundingClientRect();

  const [scrollPosition, setScrollPosition] = useState(0);

  const onScroll = useCallback(
    throttle((e: React.UIEvent<HTMLDivElement, UIEvent>) => {
      // @ts-expect-error
      const y = e.target.scrollTop;
      setScrollPosition(y);
    }, SCROLL_DEBOUNCE),
    [],
  );

  const columnDividedElements = useMemo((): ScrollElement[][] => {
    const columnHeights = Array.from({ length: columns }, (_, i) => [0, i]);
    const columnElements = Array(columns)
      .fill(undefined)
      .map(() => [] as ScrollElement[]);

    for (const element of elements) {
      columnHeights.sort((a, b) => a[0] - b[0]);
      const column = columnHeights[0][1];
      columnHeights[0][0] += element.height + rowGutter;
      columnElements[column].push(element);
    }

    return columnElements;
  }, [elements, columns]);

  const columnElements = useMemo(() => {
    return Array.from({ length: columns }, (_, i) => {
      return (
        <Column
          elements={columnDividedElements[i] ?? []}
          exhausted={exhausted}
          key={i}
          column={i}
          rowGutter={rowGutter}
          onScroll={() => {}}
          signalMore={signalMore}
          parentHeight={rect?.height ?? 0}
          renderElement={renderElement}
          scrollTop={scrollPosition}
          overscanBy={overscanBy}
        />
      );
    });
  }, [
    columns,
    rowGutter,
    scrollPosition,
    signalMore,
    rect,
    renderElement,
    overscanBy,
    columnDividedElements,
  ]);

  return (
    <div
      onScroll={onScroll}
      ref={(me) => {
        if (me) {
          setRef(me);
        }
      }}
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        columnGap: columnGutter,
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, calc(100% / ${columns}))`,
      }}
    >
      {columnElements}
    </div>
  );
}
