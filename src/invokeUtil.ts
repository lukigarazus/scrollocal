import { invoke } from "@tauri-apps/api/core";

import { LocalFile } from "./types";

class Cache<T> {
  private cache: Record<string, T> = {};
  private currentElements = [] as [string, T][];

  constructor(private maxSize: number) {}

  get(key: string) {
    return this.cache[key];
  }

  set(key: string, value: T) {
    if (this.currentElements.length >= this.maxSize) {
      const lastElement = this.currentElements.shift()!;
      delete this.cache[lastElement[0]];
    }

    this.currentElements.push([key, value]);
    this.cache[key] = value;
  }

  delete(key: string) {
    delete this.cache[key];
  }

  clear() {
    this.cache = {};
  }
}

const localFileCache = new Cache<LocalFile>(100);

let currentPromise: Promise<LocalFile[]> | null = null;
let currentPaths: string[] = [];

export function _loadLocalFile(path: string): Promise<LocalFile> {
  if (localFileCache.get(path)) {
    console.log("cache hit", path);
    return Promise.resolve(localFileCache.get(path));
  }

  currentPaths.push(path);
  if (!currentPromise)
    currentPromise = new Promise<LocalFile[]>((res) => {
      setTimeout(() => {
        currentPromise = null;
        invoke("load_file_batch", { paths: currentPaths }).then((files) => {
          res(files as LocalFile[]);
        });
        currentPaths = [];
      }, 200);
    });
  return currentPromise.then((files) => {
    const file = files.find((file) => file.name === path)!;
    if (!file) throw new Error("File not found");

    console.log("cache miss", path, !!file.data);
    localFileCache.set(path, file);
    return file;
  });
}
export async function loadLocalFile(path: string) {
  if (localFileCache.get(path)) {
    // console.log("cache hit", path);
    return Promise.resolve([localFileCache.get(path), true] as const);
  }
  const start = Date.now();
  const file = (await invoke("load_file", { path })) as LocalFile;

  if (!file) throw new Error("File not found");

  // console.log("cache miss", path, !!file.data);
  localFileCache.set(path, file);

  console.log("loadLocalFile took", Date.now() - start);
  return [file, false] as const;
}
