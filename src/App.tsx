import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api";
import "./App.css";

interface LocalFile {
  name: string;
  data: string;
  kind: string;
  extension: string;
}

interface File {
  name: string;
  src: string;
  kind: string;
  extension: string;
}

const getFileKind = (file: LocalFile) => {
  if (file.kind === "unknown") {
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

const localFileToFile = (file: LocalFile): File => {
  return {
    name: file.name,
    src: `data:${getFileKind(file)}/${getFileExtension(file)};base64,${file.data}`,
    kind: getFileKind(file),
    extension: getFileExtension(file),
  };
};

const useLocalFiles = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<Error | null>(null);

  // const loadFile = useCallback(
  //   async (path: string) => {
  //     try {
  //       const file = await readBinaryFile(path, {
  //         dir: BaseDirectory.Download,
  //       });
  //       console.log(file);
  //       const b64encoded = arrayBufferToBase64(file);
  //       setFiles((files) => [...files, b64encoded]);
  //     } catch (error) {
  //       console.log(error);
  //       setError(error as Error);
  //     }
  //   },
  //   [setFiles, setError],
  // );

  const loadFile = (path: string) => {
    invoke("load_file", { path })
      .then((files: any) => {
        setFiles((oldFiles) => [...oldFiles, ...files.map(localFileToFile)]);
      })
      .catch(console.error);
  };

  return { files, error, loadFile };
};

function Gallery({ files }: { files: File[] }) {
  return (
    <div>
      {files.map((file) => {
        switch (file.kind) {
          case "image":
            return <img key={file.name} src={file.src} />;
          case "video":
            return (
              <video key={file.name} controls loop autoPlay src={file.src} />
            );
        }
        return <div key={file.name}>Unknown file {file.name}</div>;
      })}
    </div>
  );
}

function LocalFileControl({
  setFiles,
}: {
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}) {
  const { files, loadFile } = useLocalFiles();
  const [glob, setGlob] = useState("");

  useEffect(() => setFiles(files), [files]);
  return (
    <div>
      <input value={glob} onChange={(e) => setGlob(e.target.value)} />
      <button onClick={() => loadFile(glob)}>Load</button>
    </div>
  );
}

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [error] = useState<Error | null>(null);

  console.log(files);
  return (
    <div
      className="container"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <LocalFileControl setFiles={setFiles} />
      {error && <div>{error.message}</div>}
      <Gallery files={files} />
    </div>
  );
}

export default App;
