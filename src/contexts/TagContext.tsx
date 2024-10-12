import { useHotkeysContext } from "react-hotkeys-hook";
import { createContext, useContext, useState, useEffect } from "react";
import { useSettings } from "./SettingsContext";

export type Tag = {
  name: string;
  color?: string;
  hotkey?: string;
};

type TagContext = {
  tags: Tag[];
  getTagsForId: (id: string) => Tag[];
  addTag: (tag: Tag) => void;
  removeTag: (tag: Tag) => void;
  assignTag: (id: string, tag: Tag) => void;
};

const TagContext = createContext<TagContext>({
  tags: [],
  getTagsForId: () => [],
  addTag: () => {},
  removeTag: () => {},
  assignTag: () => {},
});

const persistTags = (tags: Tag[]) => {
  localStorage.setItem("tags", JSON.stringify(tags));
};

const loadTags = (): Tag[] => {
  const tags = localStorage.getItem("tags");
  if (tags) {
    return JSON.parse(tags);
  }
  return [];
};

type TagAssignment = Record<string, string[]>;

const persistTagAssignments = (assignments: TagAssignment) => {
  localStorage.setItem("tagAssignments", JSON.stringify(assignments));
};

const loadTagAssignments = (): TagAssignment => {
  const assignments = localStorage.getItem("tagAssignments");
  if (assignments) {
    return JSON.parse(assignments);
  }
  return {};
};

export function TagProvider({ children }: { children: React.ReactNode }) {
  const { enableScope, disableScope } = useHotkeysContext();
  const { allowTags } = useSettings();

  const [tags, setTags] = useState<Tag[]>([]);
  const [tagAssignments, setTagAssignments] = useState<TagAssignment>({});

  useEffect(() => {
    const tags = loadTags();
    setTags(tags);

    const assignments = loadTagAssignments();
    setTagAssignments(assignments);
  }, []);

  useEffect(() => {
    if (allowTags) enableScope("tags");
    else disableScope("tags");
  }, [allowTags]);

  return (
    <TagContext.Provider
      value={{
        tags,
        addTag: (tag: Tag) => {
          setTags([...tags, tag]);
          persistTags([...tags, tag]);
        },
        removeTag: (tag: Tag) => {
          setTags(tags.filter((t) => t !== tag));
          persistTags(tags.filter((t) => t !== tag));
        },
        assignTag: (id: string, tag: Tag) => {
          const newAssignments = {
            ...tagAssignments,
            [id]: [...(tagAssignments[id] || []), tag.name],
          };
          setTagAssignments(newAssignments);
          persistTagAssignments(newAssignments);
        },
        getTagsForId: (id: string) => {
          return tags.filter((t) => tagAssignments[id]?.includes(t.name));
        },
      }}
    >
      {children}
    </TagContext.Provider>
  );
}

export const useTags = () => {
  return useContext(TagContext);
};
