import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ComposedFeedImpl, FeedFactory } from "../feed/Feed";
import { FinalFile } from "../types";
import { Filter, useFilter } from "./FilterContext";
import { uniqBy } from "lodash";

type FeedContext = {
  feed: ComposedFeedImpl<FinalFile, Filter>;
  registerFeed: (props: {
    name: string;
    factory: FeedFactory<FinalFile, Filter>;
  }) => void;
  unregisterFeed: (feedFactory: FeedFactory<FinalFile, Filter>) => void;
  feedNames: string[];
  switchFeedEnablement: (id: string) => void;
  isFeedEnabled: (id: string) => boolean;
};
const FeedContext = createContext<FeedContext>({
  feed: new ComposedFeedImpl<FinalFile, Filter>("", {} as Filter, 1),
  registerFeed: () => {},
  unregisterFeed: () => {},
  feedNames: [],
  switchFeedEnablement: () => {},
  isFeedEnabled: () => false,
});

const persistEnabledFeedNames = (enabledFeeds: string[]) => {
  localStorage.setItem("enabledFeeds", JSON.stringify(enabledFeeds));
};

const loadEnabledFeedNames = (): string[] => {
  const enabledFeeds = localStorage.getItem("enabledFeeds");
  if (enabledFeeds) {
    return JSON.parse(enabledFeeds);
  }
  return [];
};

export const FeedProvider = ({ children }: PropsWithChildren<{}>) => {
  const filter = useFilter();
  const [registeredFeeds, setRegisteredFeeds] = useState<
    { name: string; factory: FeedFactory<FinalFile, Filter> }[]
  >([]);
  const [enabledFeedNames, setEnabledFeedNames] = useState<string[]>(
    loadEnabledFeedNames(),
  );
  const enabledFeeds = useMemo(() => {
    return registeredFeeds
      .filter((feed) => enabledFeedNames.find((f) => f === feed.name))
      .map((feed) => feed.factory);
  }, [registeredFeeds, enabledFeedNames]);

  const feed = useMemo(() => {
    const feed = new ComposedFeedImpl<FinalFile, Filter>(
      "main feed",
      filter,
      1,
    );
    for (const feedFactory of enabledFeeds) {
      feed.registerFeed(feedFactory);
    }
    return feed;
  }, [enabledFeeds, filter.asString]);

  const feedNames = useMemo(() => {
    return registeredFeeds.map((feed) => feed.name);
  }, [registeredFeeds]);

  const switchFeedEnablement = useCallback(
    (name: string) => {
      let newEnabledFeeds = [...enabledFeedNames];
      if (enabledFeedNames.find((f) => f === name)) {
        newEnabledFeeds = enabledFeedNames.filter((f) => f !== name);
      } else {
        newEnabledFeeds = [
          ...enabledFeedNames,
          registeredFeeds.find((f) => f.name === name)!.name,
        ];
      }
      setEnabledFeedNames(newEnabledFeeds);
      persistEnabledFeedNames(newEnabledFeeds);
    },
    [enabledFeedNames, registeredFeeds],
  );
  const isFeedEnabled = useCallback(
    (id: string) => {
      return enabledFeedNames.find((f) => f === id) !== undefined;
    },
    [enabledFeedNames],
  );
  const registerFeed = useCallback(
    (payload: { name: string; factory: FeedFactory<FinalFile, Filter> }) => {
      setRegisteredFeeds((registeredFeeds) => {
        return uniqBy([...registeredFeeds, payload], (p) => p.name);
      });
    },
    [],
  );

  const unregisterFeed = useCallback(
    (feedFactory: FeedFactory<FinalFile, Filter>) => {
      setRegisteredFeeds((feeds) => feeds.filter((f) => f !== feedFactory));
    },
    [],
  );
  return (
    <FeedContext.Provider
      value={{
        feed,
        registerFeed,
        unregisterFeed,
        feedNames,
        switchFeedEnablement,
        isFeedEnabled,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
};

export const useFeed = () => {
  return useContext(FeedContext);
};
