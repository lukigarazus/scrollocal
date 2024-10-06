import { useState, useEffect } from "react";

import { Gallery } from "./Gallery";
import { LocalFileControl } from "./LocalFileControl";

import { type File } from "./types";

import "./App.css";

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [error] = useState<Error | null>(null);

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
