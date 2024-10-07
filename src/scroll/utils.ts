export type ScrollElement = {
  id: string;
  width: number;
  height: number;
  data: unknown;
  visibility?: number;
  index?: number;
  videoElement?: HTMLVideoElement;
  startPosition?: number;
  endPosition?: number;
};

export const sumHeights = (elements: ScrollElement[], rowGutter = 0) => {
  let height = 0;
  for (const element of elements) {
    height += element.height;
  }
  return height + Math.max(rowGutter * (elements.length - 1), 0);
};

export const getNextElements = async (
  getNextElement: () => Promise<ScrollElement | null>,
  n: number,
) => {
  return Promise.all(Array(n).fill(undefined).map(getNextElement));
};
