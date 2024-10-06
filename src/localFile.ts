import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api";

import { LocalFile, FinalFile } from "./types";

const getFileKind = (file: LocalFile) => {
  if (file.kind === "unknown") {
    // this is a kink of the Rust library I use for extension detection, whis is webm
    return file.extension === "ebml" ? "video" : "image";
  }
  return file.kind;
};

const getFileExtension = (file: LocalFile) => {
  if (file.extension === "ebml") {
    return "webm";
  }
  return file.extension;
};

export const localFileToFinalFile = (file: LocalFile): FinalFile => {
  return {
    name: file.name,
    src: `data:${getFileKind(file)}/${getFileExtension(file)};base64,${file.data}`,
    kind: getFileKind(file),
    extension: getFileExtension(file),
  };
};

export const useLocalFiles = () => {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [error, setError] = useState<Error | null>(null);

  const loadFiles = useCallback((path: string) => {
    invoke("load_files", { path })
      .then((files: any) => {
        setFiles(
          files.map((file: any) => {
            file.type = "local";
            return file;
          }),
        );
      })
      .catch(console.error);
  }, []);

  return { files, error, loadFiles };
};
