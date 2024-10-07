import { useState, useCallback, createContext, useContext } from "react";
import { invoke } from "@tauri-apps/api";
import { convertFileSrc } from "@tauri-apps/api/tauri";

import { LocalFile, FinalFile } from "./types";
import { useSettings } from "./contexts/SettingsContext";

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
  const localFileURL = convertFileSrc(file.name);
  // const dataFileURL = `data:${getFileKind(file)}/${getFileExtension(file)};base64,${file.data}`;
  return {
    ...file,
    src: localFileURL,
    kind: getFileKind(file),
    extension: getFileExtension(file),
  };
};

const LocalFileContext = createContext<{
  files: LocalFile[];
  setFiles: (files: LocalFile[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}>({
  files: [],
  setFiles: () => {},
  loading: false,
  setLoading: () => {},
});

export const LocalFileProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(false);
  return (
    <LocalFileContext.Provider value={{ files, setFiles, loading, setLoading }}>
      {children}
    </LocalFileContext.Provider>
  );
};

export const useLocalFiles = () => {
  const { randomize } = useSettings();

  const { files, setFiles, setLoading, loading } = useContext(LocalFileContext);

  const loadFiles = useCallback(() => {
    setLoading(true);
    return invoke(randomize ? "load_files_random" : "load_files", {})
      .then((files: any) => {
        setFiles(
          files.map((file: any) => {
            file.type = "local";
            if (file.dimentions) {
              file.dimensions.height = Number.isNaN(file.dimentions.height)
                ? 0
                : file.dimentions.height;
              file.dimensions.width = Number.isNaN(file.dimentions.width)
                ? 0
                : file.dimentions.width;
            }
            file;
            return file;
          }),
        );
      })
      .catch(console.error);
  }, []);

  return { files, loadFiles, loading };
};
