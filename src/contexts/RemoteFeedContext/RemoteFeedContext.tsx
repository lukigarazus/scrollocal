import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { RemoteItem } from "./types";
import { useFeed } from "../FeedContext";
import { useTags } from "../TagContext";
import { FeedFactory } from "../../feed/Feed";
import { FinalFile } from "../../types";
import { Filter } from "../FilterContext";
import { RemoteFeed, RemoteFeedSingle } from "./RemoteFeed";

type RemoteFeedConfig = {
  url: string;
  name: string;
  selected: boolean;
};

type RemoteFeedContextSettings = {
  feeds: RemoteFeedConfig[];
};

const persistSettings = (settings: RemoteFeedContextSettings) => {
  localStorage.setItem("remoteFeedSettings", JSON.stringify(settings));
};

const loadSettings = (): RemoteFeedContextSettings => {
  const settings = localStorage.getItem("remoteFeedSettings");
  if (settings) {
    const res = JSON.parse(settings);
    return {
      feeds: res.feeds ?? [],
    };
  }
  return { feeds: [] };
};

interface RemoteFeedContext extends RemoteFeedContextSettings {
  addFeed: (feed: RemoteFeedConfig) => void;
  removeFeed: (feed: RemoteFeedConfig) => void;
}

export const REMOTE_FEED_NAME = "Remote files feed";

const RemoteFeedContext = createContext<RemoteFeedContext>({
  feeds: [],
  addFeed: () => {},
  removeFeed: () => {},
});

type FilesState =
  | {
      kind: "loading";
    }
  | {
      kind: "loaded";
      files: RemoteItem[];
    }
  | { kind: "error" };

export const RemoteFeedProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { registerFeed } = useFeed();
  const { getTagsForId } = useTags();

  const [{ feeds }, setSettings] =
    useState<RemoteFeedContextSettings>(loadSettings());

  const addFeed = (feed: RemoteFeedConfig) => {
    setSettings({ feeds: [...feeds, feed] });
    if (currentRemoteFeedComposed.current) {
      currentRemoteFeedComposed.current.registerFeed(
        (filter) => new RemoteFeedSingle(filter, feed.url),
      );
    }
    currentFeeds.current = [...feeds, feed];
  };

  const removeFeed = (feed: RemoteFeedConfig) => {
    setSettings({ feeds: feeds.filter((f) => f.name !== feed.name) });
    if (currentRemoteFeedComposed.current) {
      currentRemoteFeedComposed.current.unregisterFeed(feed.name);
    }
    currentFeeds.current = feeds.filter((f) => f.name !== feed.name);
  };

  const currentRemoteFeedComposed = useRef<RemoteFeed | null>(null);
  const currentFeeds = useRef<RemoteFeedConfig[]>(feeds ?? []);

  const feedFactory: FeedFactory<FinalFile, Filter> = useCallback((filter) => {
    const res = new RemoteFeed(REMOTE_FEED_NAME, filter, 1);
    currentRemoteFeedComposed.current = res;
    currentFeeds.current.forEach((feed) => {
      if (currentRemoteFeedComposed.current)
        currentRemoteFeedComposed.current.registerFeed(
          (filter) => new RemoteFeedSingle(filter, feed.url),
        );
    });
    return res;
  }, []);

  useEffect(() => {
    registerFeed({ name: REMOTE_FEED_NAME, factory: feedFactory });
  }, [feedFactory, registerFeed]);
  useEffect(() => {
    persistSettings({ feeds });
  }, [feeds]);
  return (
    <RemoteFeedContext.Provider
      value={{
        feeds,
        addFeed,
        removeFeed,
      }}
    >
      {children}
    </RemoteFeedContext.Provider>
  );
};

export const useRemoteFeed = () => {
  return useContext(RemoteFeedContext);
};
