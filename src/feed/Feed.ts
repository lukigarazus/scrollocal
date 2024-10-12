/*
 * Cases to cover
 * [] Feed is exhausted
 * [] Multiple feeds
 * [] Feed is loading/not ready. I could solve this with creating a new feed on every register but then I would get a lot of flickering
 * */

import { pickRandom, handleFrequencies } from "./utils";

export interface Filter {
  // filter will not change during the lifetime of the feed, so this is not a function
  asString: string;
}

export type FeedState = "loading" | "ok" | "error" | "exhausted";
export type FeedResult<T> =
  | {
      kind: "ok";
      value: T;
    }
  | {
      kind: "error";
      error: Error;
    }
  | {
      kind: "none";
    };
export interface Feed<T, F extends Filter> {
  id: string;
  state: FeedState;
  filter: F;
  frequency: number;
  listenForChanges: (
    callback: (old: FeedState, new_: FeedState) => void,
  ) => void;
  stopListeningForChanges: (
    callback: (old: FeedState, new_: FeedState) => void,
  ) => void;
  getNext: () => Promise<FeedResult<T>>;
}

export type FeedFactory<T, F extends Filter> = (filter: F) => Feed<T, F>;

export interface ComposedFeed<T, F extends Filter> extends Feed<T, F> {
  registerFeed: (feedFactory: FeedFactory<T, F>) => void;
  unregisterFeed: (id: string) => void;
}

export abstract class FeedImpl<T, F extends Filter> implements Feed<T, F> {
  abstract id: string;
  abstract state: FeedState;
  abstract filter: F;
  abstract frequency: number;
  abstract getNext: () => Promise<FeedResult<T>>;

  protected listeners = new Set<(old: FeedState, new_: FeedState) => void>();

  protected setState = (newState: FeedState) => {
    if (newState !== this.state) {
      const oldState = this.state;
      this.state = newState;
      this.listeners.forEach((l) => l(oldState, newState));
    }
  };

  listenForChanges = (callback: (old: FeedState, new_: FeedState) => void) => {
    this.listeners.add(callback);
  };

  stopListeningForChanges = (
    callback: (old: FeedState, new_: FeedState) => void,
  ) => {
    this.listeners.delete(callback);
  };
}

export class ComposedFeedImpl<T, F extends Filter>
  extends FeedImpl<T, F>
  implements ComposedFeed<T, F>
{
  private feeds: Feed<T, F>[] = [];

  private getState = () => {
    let exhausted = false;
    let loading = false;
    let error = false;

    for (const feed of this.feeds) {
      switch (feed.state) {
        case "loading":
          loading = true;
          break;
        case "error":
          error = true;
          break;
        case "exhausted":
          exhausted = true;
          break;
      }
    }

    const res = exhausted
      ? "exhausted"
      : loading
        ? "loading"
        : error
          ? "error"
          : "ok";
    if (res !== this.state) {
      this.state = res;
      this.listeners.forEach((l) => l(this.state, res));
    }
  };

  private feedToChangeCallback = new WeakMap<
    Feed<T, F>,
    (old: FeedState, new_: FeedState) => void
  >();

  state = "loading" as FeedState;

  constructor(
    public id: string,
    public filter: F,
    public frequency: number,
  ) {
    super();
  }

  getNext = (): Promise<FeedResult<T>> => {
    if (this.state === "exhausted") {
      return Promise.resolve({ kind: "none" });
    }
    if (this.state === "loading") {
      return Promise.resolve({ kind: "none" });
    }
    if (this.state === "error") {
      return Promise.resolve({ kind: "none" });
    }

    const feed = handleFrequencies(
      this.feeds.map((feed) => ({ value: feed, frequency: feed.frequency })),
    );

    return feed.getNext();
  };

  registerFeed = (feedFactory: FeedFactory<T, F>) => {
    const feed = feedFactory(this.filter);
    this.feeds.push(feed);
    this.getState();

    const callback = (old: FeedState, new_: FeedState) => {
      this.getState();
    };

    feed.listenForChanges(callback);
    this.feedToChangeCallback.set(feed, callback);
  };

  unregisterFeed = (feedId: string) => {
    const feed = this.feeds.find((feed) => feed.id === feedId);

    if (!feed) {
      return;
    }

    this.feeds = this.feeds.filter((feed) => feed.id !== feedId);

    const callback = this.feedToChangeCallback.get(feed);
    if (callback) {
      feed.stopListeningForChanges(callback);
    }
    this.feedToChangeCallback.delete(feed);
  };
}

/*
 * Notes
 * Enabling and disabling feeds should create a new composed feed
 * Remember that the gallery should handle some of the things that you think the feed should/could
 * */
