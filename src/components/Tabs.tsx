import { ComponentType, useState } from "react";
import { HeaderWithContent } from "./HeaderWithContent";
import { Box } from "./Box";

type Tab<T> = { label: string; id: T };
export function Tabs<Tabs extends string>({
  tabs,
  components,
  headerClassName,
  bodyClassName,
}: {
  tabs: Tab<Tabs>[];
  components: Record<Tabs, ComponentType>;
  headerClassName?: string;
  bodyClassName?: string;
}) {
  const [selectedTab, setSelectedTab] = useState(tabs[0].id);
  const Component = components[selectedTab] as ComponentType;
  return (
    <HeaderWithContent>
      <div
        className={`flex gap-2 h-full justify-center ${headerClassName || ""}`}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            label={tab.label}
            id={tab.id}
            selected={tab.id === selectedTab}
          />
        ))}
      </div>
      <Box className={bodyClassName}>
        <Component />
      </Box>
    </HeaderWithContent>
  );
}

const Tab = ({
  label,
  selected,
  onClick,
}: Tab<unknown> & { selected?: boolean; onClick: () => void }) => {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer ${selected ? "font-bold border-t-white" : ""} h-full p-2 hover:bg-white/10`}
    >
      {label}
    </div>
  );
};
