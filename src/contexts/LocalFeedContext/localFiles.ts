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

export const convertFilePathToFileSrc = (
  filePath: string,
  protocol?: "stream",
) => {
  const res = convertFileSrc(filePath, protocol);
  return res;
};

export const convertFilePathToHttpSrc = (
  filePath: string,
  httpPort: number,
) => {
  return `http://192.68.1.32:${httpPort}/file?path=${filePath}`;
};

export const localFileToFinalFile = (file: LocalFile): FinalFile<LocalFile> => {
  const localFileURL = convertFilePathToFileSrc(file.name);
  // const dataFileURL = `data:${getFileKind(file)}/${getFileExtension(file)};base64,${file.data}`;
  return {
    ...file,
    src: [{ url: localFileURL, dimensions: file.dimensions }],
    kind: getFileKind(file),
    extension: getFileExtension(file),
    additional: file,
  };
};

export const snipLocalFile = (
  path: string,
  outputName: string,
  from: string,
  to: string,
  shouldSaveToGallery?: boolean,
) => {
  return invoke("snip_file", {
    sourcePathString: path,
    clipName: outputName,
    from: from,
    to: to,
    extension: "webm",
    shouldSaveToGallery,
  });
};

export const moveFileToAssets = (filePath: string) =>
  invoke("move_file_to_data_dir", { dir: filePath });

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
