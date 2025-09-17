import {
  ComposedFeedImpl,
  FeedImpl,
  FeedResult,
  FeedState,
} from "../../feed/Feed";
import { Filter } from "../FilterContext";
import { FinalFile } from "../../types";
import { RemoteItem } from "./types";

export class RemoteFeedSingle extends FeedImpl<FinalFile, Filter> {
  id = "scrolller";
  frequency = 1;
  state = "ok" as FeedState;
  filter = {} as Filter;

  private iterator = "";
  private items: RemoteItem[] = [];
  private currentIndex = 0;
  private promise: Promise<{ iterator: string; items: RemoteItem[] }> | null =
    null;

  constructor(
    filter: Filter,
    private url: string,
  ) {
    super();

    this.filter = filter;
  }

  getNext = async (): Promise<FeedResult<RemoteItem>> => {
    if (this.state !== "ok") {
      return { kind: "none" };
    }

    if (this.currentIndex >= this.items.length) {
      try {
        console.log(this.url);
        const data = await (this.promise ??
          (this.promise = fetch(this.url).then((res) => res.json())));
        const { items } = data;

        this.items = items.map((item: RemoteItem) => {
          return {
            ...item,
            src: item.src.map((src) => ({
              ...src,
              url: new URL(src.url, this.url).href,
            })),
          };
        });

        return this.getNext();
      } catch (e) {
        console.log(e);
        this.setState("exhausted");
        return { kind: "none" };
      }
    }

    const item = this.items[this.currentIndex];
    this.currentIndex++;
    return {
      kind: "ok",
      value: item,
    };
  };
}

export class RemoteFeed extends ComposedFeedImpl<FinalFile, Filter> {}
