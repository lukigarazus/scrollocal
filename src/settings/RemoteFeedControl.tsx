import { useState } from "react";
import { useRemoteFeed } from "../contexts/RemoteFeedContext/RemoteFeedContext";

export const RemoteFeedControl = () => {
  const { feeds, addFeed, removeFeed } = useRemoteFeed();
  const [localName, setLocalName] = useState("");
  const [localUrl, setLocalUrl] = useState("");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "5px" }}>
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
        />
        <input
          type="text"
          value={localUrl}
          onChange={(e) => setLocalUrl(e.target.value)}
        />
        <button
          disabled={!localName || !localUrl}
          onClick={() => {
            addFeed({ name: localName, url: localUrl, selected: true });
            setLocalName("");
            setLocalUrl("");
          }}
        >
          Add
        </button>
      </div>
      {feeds.map((feed) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            gap: "5px",
          }}
          key={feed.name}
        >
          <span>{feed.name}</span>{" "}
          <button onClick={() => removeFeed(feed)}>X</button>
        </div>
      ))}
    </div>
  );
};
