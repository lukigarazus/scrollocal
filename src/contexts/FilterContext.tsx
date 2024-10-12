import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Tag } from "./TagContext";

export type Filter = {
  tags: Tag[];
  asString: string;
};

type FilterContext = Filter & {
  setTags: (tags: Tag[]) => void;
};
const FilterContext = createContext<FilterContext>({
  tags: [],
  setTags: () => {},
  asString: "",
});

const persistFilterContext = (filters: { tags: Tag[] }) => {
  localStorage.setItem("filter", JSON.stringify(filters));
};

const loadFilterContext = (): { tags: Tag[] } => {
  const filters = localStorage.getItem("filter");
  if (filters) {
    return JSON.parse(filters);
  }
  return { tags: [] };
};

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const loaded = useMemo(() => loadFilterContext(), []);
  const [tags, setTags] = useState<Tag[]>(loaded.tags);

  const asString = useMemo(() => {
    return tags.map((t) => t.name).join(",");
  }, [tags]);

  useEffect(() => {
    persistFilterContext({ tags });
  }, [tags]);

  return (
    <FilterContext.Provider
      value={{
        tags,
        setTags,
        asString,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  return useContext(FilterContext);
};
