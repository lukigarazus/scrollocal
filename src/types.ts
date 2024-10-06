interface Dimensions {
  width: number;
  height: number;
  aspect_ratio: string;
}
export interface LocalFile {
  type: "local";
  name: string;
  lazy: boolean;
  data: string | null;
  kind: string;
  extension: string;
  dimensions?: Dimensions;
}

export type File = LocalFile;

export interface FinalFile {
  name: string;
  src: string;
  kind: string;
  extension: string;
  dimensions?: Dimensions;
}

export const calculateDimensions = (
  dimensions: Dimensions | undefined,
  columnWidth: number,
) => {
  if (!dimensions) {
    return { width: columnWidth, height: 0 };
  }
  const { width, height } = dimensions;
  const aspectRatio = width / height;
  const columnHeight = columnWidth / aspectRatio;
  return { width: columnWidth, height: columnHeight };
};
