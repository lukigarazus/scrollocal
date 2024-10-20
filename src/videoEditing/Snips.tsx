import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { snipLocalFile } from "../contexts/LocalFeedContext/localFiles";
import { useLocalFeed } from "../contexts/LocalFeedContext/LocalFeedContext";
import { useFeed } from "../contexts/FeedContext";

export type Snip = {
  id: string;
  from: string;
  to: string;
  done: boolean;
  name: string;
  loading?: boolean;
};

type VideoFragment = {
  videoPath: string;
  videoElement: HTMLVideoElement;
};

type SettingsFragment = {
  shouldSavetoGallery?: boolean;
};

export const SnipsContainer = ({
  videoElement,
  ...props
}: VideoFragment & SettingsFragment) => {
  const [snips, setSnips] = useState<Snip[]>([]);
  const [activeSnip, setActiveSnip] = useState<string | null>(null);

  useHotkeys(
    "n",
    () => {
      const aSnip = snips.find((s) => s.id === activeSnip);
      if (!((+aSnip?.to && +aSnip?.from) || !aSnip)) {
        return;
      }
      if (aSnip && !aSnip.name) {
        aSnip.name = String(Date.now());
      }
      const id = String(Date.now());
      const newSnip = { id, from: "0", to: "0", done: false, name: "" };

      setSnips((oldSnips) => [newSnip, ...oldSnips]);

      setActiveSnip(id);
    },
    [snips, activeSnip],
  );
  useHotkeys(
    "s",
    () => {
      if (!activeSnip || snips.find((s) => s.id === activeSnip)?.done) {
        return;
      }

      setSnips((oldSnips) =>
        oldSnips.map((s) => {
          if (s.id === activeSnip) {
            return { ...s, from: videoElement.currentTime.toString() };
          }
          return s;
        }),
      );
    },
    [snips, activeSnip],
  );
  useHotkeys(
    "e",
    () => {
      const aSnip = snips.find((s) => s.id === activeSnip);
      if (!activeSnip || aSnip?.done || !+aSnip?.from) {
        return;
      }

      setSnips((oldSnips) =>
        oldSnips.map((s) => {
          if (s.id === activeSnip) {
            return { ...s, to: videoElement.currentTime.toString() };
          }
          return s;
        }),
      );
    },
    [snips, activeSnip],
  );
  return (
    <div>
      {snips.map((snip) => (
        <SingleSnip
          {...props}
          key={snip.id}
          videoElement={videoElement}
          {...snip}
          isActive={activeSnip === snip.id}
          setSnip={(snip) => {
            setSnips(
              snips.map((s) => {
                if (s.id === snip.id) {
                  return snip;
                }
                return s;
              }),
            );
          }}
        />
      ))}
    </div>
  );
};

const SingleSnip = ({
  id,
  from,
  to,
  done,
  name,
  loading,
  setSnip,
  isActive,
  videoPath,
  videoElement,
  shouldSavetoGallery,
}: Snip &
  VideoFragment &
  SettingsFragment & {
    isActive: boolean;
    setSnip: (snip: Snip) => void;
  }) => {
  const { triggerReload } = useLocalFeed();
  const { triggerReload: triggerFeedReload } = useFeed();
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: `1px solid ${isActive ? "gold" : "black"}`,
        padding: "5px",
        margin: "5px",
      }}
    >
      <input
        disabled={loading || done}
        type="text"
        value={name}
        onChange={(e) => {
          const snip = { id, from, to, done, name: e.target.value };
          setSnip(snip);
        }}
      />
      <span>
        {formatDuration(+from)} - {formatDuration(+to)}
      </span>
      <span>{loading ? "loading..." : done ? "done" : "not created"}</span>
      <button
        disabled={done || loading || isActive || !name}
        onClick={() => {
          setSnip({ id, from, to, done: false, name, loading: true });
          snipLocalFile(
            videoPath,
            name,
            from!,
            String(+to! - +from!),
            shouldSavetoGallery,
          )
            .then((res) => {
              triggerReload().then(triggerFeedReload);
              setSnip({ id, from, to, done: true, name, loading: false });
            })
            .catch(() => {
              setSnip({ id, from, to, done: false, name, loading: false });
            });
        }}
      >
        Create
      </button>
    </div>
  );
};

const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor(duration / 60);
  const seconds = Math.floor(duration % 60);
  return `${hours}:${minutes}:${seconds.toString().padStart(2, "0")}`;
};
