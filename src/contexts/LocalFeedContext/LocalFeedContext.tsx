import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { invoke } from "@tauri-apps/api/core";

import { LocalFile } from "./types";
import { loadLocalFiles } from "./localFiles";
import { useFeed } from "../FeedContext";
import { useTags } from "../TagContext";
import { FeedFactory } from "../../feed/Feed";
import { FinalFile } from "../../types";
import { Filter } from "../FilterContext";
import { LocalFeed } from "./LocalFeed";

type LocalFeedContextSettings = {
  glob: string | null;
  randomize: boolean;
};

const persistSettings = (settings: LocalFeedContextSettings) => {
  localStorage.setItem("localFeedSettings", JSON.stringify(settings));
};

const loadSettings = (): LocalFeedContextSettings => {
  const settings = localStorage.getItem("localFeedSettings");
  if (settings) {
    return JSON.parse(settings);
  }
  return { glob: null, randomize: false };
};

interface LocalFeedContext extends LocalFeedContextSettings {
  setGlob: (glob: string | null) => void;
  setRandomize: (randomize: boolean) => void;
  loadGlobFiles: () => Promise<void>;
  triggerReload: () => Promise<void>;
}

export const LOCAL_FEED_NAME = "Local files feed";

const LocalFeedContext = createContext<LocalFeedContext>({
  glob: null,
  setGlob: () => {},
  randomize: false,
  setRandomize: () => {},
  loadGlobFiles: async () => {},
  triggerReload: async () => {},
});

type FilesState =
  | {
      kind: "loading";
    }
  | {
      kind: "loaded";
      files: LocalFile[];
    }
  | { kind: "error" };

export const LocalFeedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { registerFeed } = useFeed();
  const { getTagsForId } = useTags();

  const [{ glob, randomize }, setSettings] =
    useState<LocalFeedContextSettings>(loadSettings());
  const [bareFiles, setBareFiles] = useState<FilesState>({ kind: "loading" });
  // const files = useMemo(() => {
  //   if (bareFiles.kind === "loading") return bareFiles;
  //   if (bareFiles.kind === "error") return bareFiles;
  //   return {
  //     kind: "loaded",
  //     files:
  //       tags.length > 0
  //         ? bareFiles.files.filter((file) => {
  //             const fileTags = getTagsForId(file.name);
  //             const res = tags.every((tag) =>
  //               fileTags.find((fT) => fT.name === tag.name),
  //             );
  //             if (fileTags.length)
  //               console.log("file tags", fileTags, res, tags);
  //             return res;
  //           })
  //         : bareFiles.files,
  //   };
  // }, [bareFiles, tags]);
  // const feedState = useRef(0);

  const setGlob = useCallback((glob: string | null) => {
    setSettings((settings) => {
      const newSettings = { ...settings, glob };
      persistSettings(newSettings);
      return newSettings;
    });
  }, []);

  const setRandomize = useCallback((randomize: boolean) => {
    setSettings((settings) => {
      const newSettings = { ...settings, randomize };
      persistSettings(newSettings);
      return newSettings;
    });
  }, []);
  const filesListener = useRef<((files: LocalFile[]) => void) | null>(null);
  const feedFilesPass = useRef((callback: (files: LocalFile[]) => void) => {
    filesListener.current = callback;
  });
  const feedFactory: FeedFactory<FinalFile, Filter> = useCallback(
    (filter) => new LocalFeed(filter, feedFilesPass.current),
    [],
  );
  // const getNextFile = useCallback(async (): Promise<GetNextFileResult> => {
  //   console.log("getting next local file", files);
  //   if (files.kind === "loading") return { kind: "loading" };
  //   if (files.kind === "loaded") {
  //     const file = files.files[feedState.current];
  //     feedState.current = feedState.current + 1;
  //     if (!file) {
  //       return {
  //         kind: "none" as const,
  //       };
  //     }
  //     return {
  //       kind: "ok",
  //       file: localFileToFinalFile(file),
  //     };
  //   }
  //   return {
  //     kind: "none" as const,
  //   };
  // }, [files]);

  const loadGlobFiles = useCallback(() => {
    return invoke("clean_data_dir")
      .then(() => invoke("move_files_to_data_dir", { path: glob }))
      .then(() => loadLocalFiles({ randomize }))
      .then(() => {});
  }, [randomize]);

  const triggerReload = useCallback(() => {
    return loadLocalFiles({ randomize }).then((files) => {
      setBareFiles({
        kind: "loaded",
        files,
      });
    });
  }, [loadGlobFiles]);

  // useEffect(() => {
  //   if (files.kind !== "loaded") return;
  //   registerFeed({
  //     id: LOCAL_FEED_NAME,
  //     getNextFile,
  //     isExhausted: () => {
  //       console.log(feedState.current, files.files, bareFiles.files);
  //       return files.files.length === feedState.current;
  //     },
  //   });
  // }, [getNextFile, files]);
  useEffect(() => {
    triggerReload();
  }, []);
  useEffect(() => {
    registerFeed({ name: LOCAL_FEED_NAME, factory: feedFactory });
  }, [feedFactory, registerFeed]);
  // useEffect(() => {
  //   feedState.current = 0;
  // }, [files, asString]);
  useEffect(() => {
    if (filesListener.current && bareFiles.kind === "loaded") {
      filesListener.current(bareFiles.files);
    }
  }, [bareFiles, feedFactory]);
  return (
    <LocalFeedContext.Provider
      value={{
        glob,
        randomize,
        setGlob,
        setRandomize,
        loadGlobFiles,
        triggerReload,
      }}
    >
      {children}
    </LocalFeedContext.Provider>
  );
};

export const useLocalFeed = () => {
  return useContext(LocalFeedContext);
};
