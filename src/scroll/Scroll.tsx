import { throttle } from "lodash";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { calculateDimensions } from "../types";
import { type ScrollElement, sumHeights, getNextElements } from "./utils";

const SCROLL_DEBOUNCE = 0;

// function pickRandomElement<T>(elements: T[]) {
//   const index = Math.floor(Math.random() * elements.length);
//   return elements[index];
// }
//
// const aspectRatios = [0.2, 0.4, 0.6, 0.8, 1, 1.2, 1.4, 1.6];
//
// const getRandomElement = () => {
//   const width = Math.random() * 10;
//   return {
//     id: Math.random().toString(),
//     width,
//     height: width * pickRandomElement(aspectRatios),
//     data: Math.random(),
//   };
// };

function ScrollElement({
  width,
  height,
  index,
  data,
  renderElement,
  id,
  visibility,
}: ScrollElement & {
  columnWidth: number;
  renderElement: (element: ScrollElement) => ReactNode;
}) {
  const [debounced, setDebounced] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebounced(true);
    }, 200);
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
        ? renderElement({ width, height, data, id, visibility, index })
        : null}
    </div>
  );
}

type ColumnProps = {
  column: number;
  rowGutter: number;
  onScroll: (x: number, y: number) => void;
  getNextElement: () => Promise<ScrollElement | null>;
  parentHeight: number;
  renderElement: (element: ScrollElement) => ReactNode;
  scrollTop: number;
  overscanBy: number;
};

function Column({
  rowGutter,
  getNextElement,
  renderElement,
  scrollTop,
  parentHeight,
  overscanBy,
}: ColumnProps) {
  const { rect, setRef } = useBoundingClientRect();

  const [elements, setElements] = useState<ScrollElement[]>([]);
  const [exhausted, setExhausted] = useState(false);

  const width = rect?.width ?? 0;

  const elementsWithDimensions = useMemo<ScrollElement[]>(() => {
    return elements.map((element) => {
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
    });
  }, [elements, width]);

  const { visibleElements, topOffset, bottomOffset } = useMemo(() => {
    const start = Date.now();
    let firstVisibleFound = false;
    const windowStartBase = scrollTop;
    const windowEndBase = windowStartBase + parentHeight;
    const windowStart = Math.max(windowStartBase - overscanBy, 0);
    const windowEnd = windowEndBase + overscanBy;
    let y = 0;
    const result: ScrollElement[] = [];
    for (const element of elementsWithDimensions) {
      const startPosition = y;
      const endPosition = y + element.height;

      if (!(windowStart > endPosition || windowEnd < startPosition)) {
        if (!firstVisibleFound) firstVisibleFound = true;

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
      } else {
        if (firstVisibleFound) break;
      }

      y += element.height + rowGutter;
    }
    const firstVisibleIndex = elementsWithDimensions.indexOf(result[0]);
    const lastVisibleIndex = elementsWithDimensions.indexOf(
      result[result.length - 1],
    );

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
    console.log("Recalc took", end - start, "ms");
    return { visibleElements: result, topOffset, bottomOffset };
  }, [elementsWithDimensions, scrollTop]);

  useEffect(() => {
    if (bottomOffset < overscanBy) {
      if (exhausted) return;
      getNextElements(getNextElement, 10).then((elements) => {
        const hasNull = elements.includes(null);
        if (hasNull) setExhausted(true);

        setElements((oldElements) => [
          ...oldElements,
          ...(elements.filter(Boolean) as ScrollElement[]),
        ]);
      });
    }
  }, [bottomOffset, exhausted]);
  useEffect(() => {
    setElements([]);
    setExhausted(false);
  }, [getNextElement]);

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
          />
        ))}
        {exhausted && <div>I'm exhausted</div>}
      </div>
      <div style={{ height: bottomOffset }} />
    </div>
  );
}

type ScrollProps = {
  columns: number;
  rowGutter: number;
  columnGutter: number;
  onScroll: (x: number, y: number) => void;
  getNextElement: () => Promise<ScrollElement | null>;
  overscanByPixels?: number;
  renderElement: (element: ScrollElement) => ReactNode;
};

const useBoundingClientRect = () => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const element = ref;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setRect(entries[0].contentRect);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return { rect, setRef };
};

export default function Scroll({
  columns,
  rowGutter,
  columnGutter,
  getNextElement,
  overscanByPixels = 500,
  renderElement,
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

  const columnElements = useMemo(() => {
    return Array.from({ length: columns }, (_, i) => {
      return (
        <Column
          key={i}
          column={i}
          rowGutter={rowGutter}
          onScroll={() => {}}
          getNextElement={getNextElement}
          parentHeight={rect?.height ?? 0}
          renderElement={renderElement}
          scrollTop={scrollPosition}
          overscanBy={overscanByPixels}
        />
      );
    });
  }, [
    columns,
    rowGutter,
    scrollPosition,
    getNextElement,
    rect,
    renderElement,
    overscanByPixels,
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
