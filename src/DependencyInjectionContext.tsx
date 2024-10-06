import { useState, useEffect, createContext } from "react";
import { LocalFile } from "./types";

type DependencyInjectionContext = {
  loadLocalFiles: () => Promise<LocalFile[]>;
};

const DependencyInjectionContext = createContext(null);
