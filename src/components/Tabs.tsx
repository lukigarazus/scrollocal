import { ComponentType, useState, useEffect } from "react";
import { HeaderWithContent } from "./HeaderWithContent";
import { Box } from "./Box";
import { useSettings } from "../contexts/SettingsContext";

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
  const { currentTab, setCurrentTab } = useSettings();
  const [selectedTab, setSelectedTab] = useState<Tabs | undefined>(undefined);
  const Component = selectedTab
    ? (components[selectedTab] as ComponentType)
    : () => null;

  useEffect(() => {
    if (currentTab) {
      setSelectedTab(currentTab as Tabs);
    } else {
      setCurrentTab(tabs[0].id);
    }
  }, [currentTab]);
  useEffect(() => {
    if (selectedTab) {
      setCurrentTab(selectedTab);
    }
  }, [selectedTab]);
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
