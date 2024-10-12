import {
  useContext,
  useState,
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useCallback,
} from "react";

export type Settings = {
  loading: boolean;
  autoplay: boolean;
  showControlsInGalleryView: boolean;
  bufferSize: number;
  maxVideoElements: number;
  allowTags: boolean;
};

type SettingsContext = Settings & {
  setAutoplay: (autoplay: boolean) => void;
  setShowControlsInGalleryView: (showControlsInGalleryView: boolean) => void;
  setBufferSize: (bufferSize: number) => void;
  setMaxVideoElements: (maxVideoElements: number) => void;
  setAllowTags: (allowTags: boolean) => void;
};

export const persistSettings = (settings: Settings) => {
  localStorage.setItem("settings", JSON.stringify(settings));
};

const defaultSettings: Settings = {
  allowTags: false,
  loading: true,
  autoplay: true,
  showControlsInGalleryView: false,
  bufferSize: 2,
  maxVideoElements: 20,
};

export const loadSettings = (): Settings => {
  const settings = localStorage.getItem("settings");
  if (settings) {
    return JSON.parse(settings);
  }
  return defaultSettings;
};

export const SettingsContext = createContext<SettingsContext>({
  ...defaultSettings,
  setAutoplay: (autoplay: boolean) => {},
  setShowControlsInGalleryView: (showControlsInGalleryView: boolean) => {},
  setBufferSize: (bufferSize: number) => {},
  setMaxVideoElements: (maxVideoElements: number) => {},
  setAllowTags: (allowTags: boolean) => {},
});

export const SettingsProvider = ({ children }: PropsWithChildren) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const setValue = useCallback(
    function <Key extends keyof Settings>(key: Key) {
      return (value: Settings[Key]) => {
        setSettings({ ...settings, [key]: value });
      };
    },
    [settings],
  );

  const value = useMemo(() => {
    return {
      ...settings,
      setAllowTags: setValue("allowTags"),
      setAutoplay: setValue("autoplay"),
      setShowControlsInGalleryView: setValue("showControlsInGalleryView"),
      setBufferSize: setValue("bufferSize"),
      setMaxVideoElements: setValue("maxVideoElements"),
    } satisfies SettingsContext;
  }, [settings]);

  useEffect(() => {
    const settings = loadSettings();
    setSettings({ ...settings, loading: false });
  }, []);

  useEffect(() => {
    persistSettings(value);
  }, [value]);
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  return useContext(SettingsContext);
};
