import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";

import { FinalFile } from "../../types";
import { LocalFile } from "./types";

const getFileKind = (file: LocalFile): "video" | "image" => {
  // First check if the file kind is explicitly set to image
  if (file.kind === "image") {
    return "image";
  }

  // If kind is video, return video
  if (file.kind === "video") {
    return "video";
  }

  // For unknown types, use extension-based detection with MP4 support
  if (file.kind === "unknown") {
    const videoExtensions = ["mp4", "m4v", "mov", "avi", "mkv", "webm", "flv", "ebml"];
    const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"];

    const ext = file.extension.toLowerCase();

    if (videoExtensions.includes(ext)) {
      return "video";
    }
    if (imageExtensions.includes(ext)) {
      return "image";
    }

    // Default fallback - if we can't determine, assume it's an image
    return "image";
  }

  // Default to video for any other cases (audio files will be treated as video for now)
  return "video";
};

const getFileExtension = (file: LocalFile) => {
  // Handle special cases where the detected extension needs normalization
  switch (file.extension.toLowerCase()) {
    case "ebml":
      return "webm";
    case "m4v":
      return "mp4"; // Normalize m4v to mp4 for consistency
    default:
      return file.extension;
  }
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
