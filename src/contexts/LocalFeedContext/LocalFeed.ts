import { FeedImpl, FeedResult, FeedState } from "../../feed/Feed";
import { FinalFile } from "../../types";
import { Filter } from "../FilterContext";
import { localFileToFinalFile } from "./localFiles";
import { LocalFile } from "./types";

export class LocalFeed extends FeedImpl<FinalFile, Filter> {
  id = "local";
  state = "loading" as FeedState;
  frequency = 1;

  private localFiles: LocalFile[] = [];
  private currentIndex = 0;

  constructor(
    public filter: Filter,
    private registerFilesListener: (
      callback: (files: LocalFile[]) => void,
    ) => void,
  ) {
    super();

    this.registerFilesListener((files) => {
      this.setFiles(files);
    });
  }

  getNext = async (): Promise<FeedResult<FinalFile>> => {
    console.log("local feed get next", this.state);
    if (this.state !== "ok") {
      return { kind: "none" };
    }

    if (this.currentIndex >= this.localFiles.length) {
      this.setState("exhausted");
      return { kind: "none" };
    }

    const file = this.localFiles[this.currentIndex];
    this.currentIndex++;
    return {
      kind: "ok",
      value: localFileToFinalFile(file),
    };
  };

  setFiles = (files: LocalFile[]) => {
    this.localFiles = files;

    if (this.state === "loading") {
      this.setState("ok");
    }
  };
}
