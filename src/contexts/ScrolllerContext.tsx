import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useFeed } from "./FeedContext";
import { FeedImpl, FeedResult, FeedState } from "../feed/Feed";
import { Filter } from "./FilterContext";
import { FinalFile } from "../types";
import {
  getScrolllerData,
  ScrolllerResult,
  Subreddit,
  SubredditPost,
} from "../api/scrolller";

const ScrolllerContext = createContext<{}>({});

const getFileExtension = (url: string) => {
  const parts = url.split(".");
  return parts[parts.length - 1];
};

const scrolllerItemToFinalFile = (
  item: SubredditPost,
): FinalFile<SubredditPost> => {
  const firstMediaSource = item.mediaSources.find(
    (source) => !source.url.match(/\.(jpg|mp4)/),
  )!;

  return {
    name: String(item.id),
    kind: "video",
    type: "scrolller",
    extension: getFileExtension(firstMediaSource.url),
    dimensions: {
      height: firstMediaSource.height,
      width: firstMediaSource.width,
      aspect_ratio: "1:1",
    },
    src: firstMediaSource.url,
  };
};

class ScrolllerFeed extends FeedImpl<FinalFile, Filter> {
  id = "scrolller";
  frequency = 1;
  state = "ok" as FeedState;
  filter = {} as Filter;

  private iterator = "";
  private items: SubredditPost[] = [];
  private currentIndex = 0;
  private promise: Promise<{ iterator: string; items: Subreddit[] }> | null =
    null;

  constructor() {
    super();
  }

  getNext = async (): Promise<FeedResult<FinalFile<SubredditPost>>> => {
    console.log("Scrolller getting next");
    if (this.state !== "ok") {
      return { kind: "none" };
    }

    if (this.currentIndex >= this.items.length) {
      try {
        const data = await (this.promise ??
          (this.promise = getScrolllerData({
            iterator: this.iterator,
            filter: "VIDEO",
          })));
        const { iterator, items: subreddits } = data;

        this.iterator = iterator;

        const items = subreddits.flatMap(
          (subreddit) => subreddit.children.items,
        );

        this.items.push(...items);

        return this.getNext();
      } catch {
        console.log("Scrolller exhausted");
        this.setState("exhausted");
        return { kind: "none" };
      }
    }

    const item = this.items[this.currentIndex];
    this.currentIndex++;
    return {
      kind: "ok",
      value: scrolllerItemToFinalFile(item),
    };
  };
}

export const ScrolllerProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { registerFeed } = useFeed();

  const getFeed = useCallback(() => new ScrolllerFeed(), [registerFeed]);

  useEffect(() => {
    registerFeed({
      name: "scrolller",
      factory: getFeed,
    });
  }, []);
  return (
    <ScrolllerContext.Provider value={{}}>{children}</ScrolllerContext.Provider>
  );
};

export const useScrolller = () => {
  return useContext(ScrolllerContext);
};
