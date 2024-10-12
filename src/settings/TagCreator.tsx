import { useState } from "react";
import invert from "invert-color";
import { useTags, type Tag } from "../contexts/TagContext";
import { withConfirm } from "../utils";
import { RecordHotkeys } from "../components/RecordHotkeys";

function Tag({ tag, removeTag }: { tag: Tag; removeTag?: (tag: Tag) => void }) {
  const { name, color = "#fff" } = tag;
  return (
    <div
      style={{
        backgroundColor: color,
        color: invert(color, true),
        border: "none",
        padding: "2px",
        display: "flex",
        alignItems: "center",
        gap: "5px",
        borderRadius: "5px",
        userSelect: "none",
      }}
    >
      {name}
      {removeTag && (
        <button
          style={{
            backgroundColor: color,
            color: invert(color, true),
            border: "none",
            padding: "2px",
            outline: "none",
            boxShadow: "none",
          }}
          onClick={() =>
            withConfirm(
              "Do you really want to remove the tag?",
              { title: "Deleting tag", kind: "warning" },
              () => removeTag(tag),
            )
          }
        >
          X
        </button>
      )}
    </div>
  );
}

const HEIGHT = "50px";
const HOTKEY_SEPARATOR = "+";

export function TagCreator() {
  const { tags, addTag, removeTag } = useTags();
  const [localTag, setLocalTag] = useState<Tag>({
    name: "",
    color: "#fff",
  });
  return (
    <div>
      <div style={{ display: "flex", gap: "5px" }}>
        {tags.map((tag) => (
          <Tag removeTag={removeTag} key={tag.name} tag={tag} />
        ))}
      </div>
      <div style={{ display: "flex", gap: "5px" }}>
        <div style={{ display: "flex", gap: "5px" }}>
          <input
            value={localTag?.name}
            onChange={(e) => setLocalTag({ ...localTag, name: e.target.value })}
            type="text"
            placeholder="Tag name"
            style={{ width: "100%", height: HEIGHT, boxSizing: "border-box" }}
          />
          <input
            value={localTag?.color}
            onChange={(e) =>
              setLocalTag({ ...localTag, color: e.target.value })
            }
            type="color"
            placeholder="Tag color"
            style={{
              width: HEIGHT,
              height: HEIGHT,
              boxSizing: "border-box",
              padding: "2px",
            }}
          />
          <RecordHotkeys
            value={new Set(localTag?.hotkey?.split(HOTKEY_SEPARATOR))}
            onChange={(hotkey) => {
              setLocalTag({
                ...localTag,
                hotkey: Array.from(hotkey).join(HOTKEY_SEPARATOR),
              });
            }}
          />
        </div>
        <button
          onClick={() => {
            addTag(localTag);
            setLocalTag({ name: "", color: "#fff" });
          }}
          style={{ height: HEIGHT, boxSizing: "border-box" }}
        >
          Add tag
        </button>
      </div>
    </div>
  );
}
