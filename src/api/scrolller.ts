import { invoke } from "@tauri-apps/api/core";

export type SubredditPost = {
  __typename: "SubredditPost";
  id: number;
  url: string;
  title: string;
  subredditId: number;
  subredditTitle: string;
  subredditUrl: string;
  redditPath: string;
  isNsfw: boolean;
  albumUrl: string | null;
  hasAudio: boolean;
  fullLengthSource: string | null;
  gfycatSource: string | null;
  redgifsSource: string | null;
  ownerAvatar: string | null;
  username: string | null;
  displayName: string | null;
  isPaid: boolean | null;
  tags: string[] | null;
  isFavorite: boolean;
  mediaSources: {
    url: string;
    width: number;
    height: number;
    isOptimized: boolean;
  }[];
  blurredMediaSources:
    | {
        url: string;
        width: number;
        height: number;
        isOptimized: boolean;
      }[]
    | null;
};
export type Subreddit = {
  __typename: "Subreddit";
  id: number;
  url: string;
  title: string;
  secondaryTitle: string;
  description: string;
  createdAt: string;
  isNsfw: boolean;
  subscribers: number;
  isComplete: boolean;
  itemCount: number;
  videoCount: number;
  pictureCount: number;
  albumCount: number;
  isPaid: boolean | null;
  username: string | null;
  tags: string[] | null;
  banner: string | null;
  isFollowing: boolean;
  children: { iterator: string; items: SubredditPost[] };
};

export type ScrolllerResult = {
  data: {
    discoverFilteredSubreddits: {
      iterator: string;
      items: Subreddit[];
    };
  };
};

export async function getScrolllerData(
  {
    iterator,
    filter,
    isNsfw = false,
  }: { iterator?: string; filter?: "VIDEO" | "IMAGE"; isNsfw?: boolean } = {
    iterator: "",
    filter: "VIDEO",
  },
) {
  const payload = { iterator, filter, isNsfw };
  if (!iterator) delete payload.iterator;
  const data: string = await invoke("get_scrolller_data", payload);

  return (JSON.parse(data) as ScrolllerResult).data.discoverFilteredSubreddits;
}
