import { Dimensions } from "../../types";

export interface LocalFile {
  type: "local";
  name: string;
  lazy: boolean;
  data: string | null;
  kind: string;
  extension: string;
  dimensions?: Dimensions;
}
