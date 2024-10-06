export interface LocalFile {
  type: "local";
  name: string;
  lazy: boolean;
  data: string | null;
  kind: string;
  extension: string;
}

export type File = LocalFile;

export interface FinalFile {
  name: string;
  src: string;
  kind: string;
  extension: string;
}
