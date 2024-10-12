import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

import { FinalFile } from "../../types";
import { LocalFile } from "./types";

const getFileKind = (file: LocalFile): "video" | "image" => {
  if (file.kind === "unknown") {
    // this is a kink of the Rust library I use for extension detection, whis is webm
    return file.extension === "ebml" ? "video" : "image";
  }
  return file.kind === "image" ? "image" : "video";
};

const getFileExtension = (file: LocalFile) => {
  if (file.extension === "ebml") {
    return "webm";
  }
  return file.extension;
};

export const localFileToFinalFile = (file: LocalFile): FinalFile<LocalFile> => {
  const localFileURL = convertFileSrc(file.name);
  // const dataFileURL = `data:${getFileKind(file)}/${getFileExtension(file)};base64,${file.data}`;
  return {
    ...file,
    src: localFileURL,
    kind: getFileKind(file),
    extension: getFileExtension(file),
    additional: file,
  };
};

export const loadLocalFiles = ({
  randomize,
}: {
  randomize: boolean;
}): Promise<LocalFile[]> => {
  return invoke(randomize ? "load_files_random" : "load_files", {})
    .then((files: any) => {
      return files.map((file: any) => {
        file.type = "local";
        return file;
      });
    })
    .catch(console.error);
};
