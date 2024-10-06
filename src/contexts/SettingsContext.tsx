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
  glob: string;
  randomize: boolean;
  autoplay: boolean;
  showControlsInGalleryView: boolean;
  bufferSize: number;
};

type SettingsContext = Settings & {
  setGlob: (glob: string) => void;
  setRandomize: (randomize: boolean) => void;
  setAutoplay: (autoplay: boolean) => void;
  setShowControlsInGalleryView: (showControlsInGalleryView: boolean) => void;
  setBufferSize: (bufferSize: number) => void;
};

export const persistSettings = (settings: Settings) => {
  localStorage.setItem("settings", JSON.stringify(settings));
};

const defaultSettings: Settings = {
  loading: true,
  glob: "",
  randomize: false,
  autoplay: true,
  showControlsInGalleryView: false,
  bufferSize: 2,
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
  setGlob: (glob: string) => {},
  setRandomize: (randomize: boolean) => {},
  setAutoplay: (autoplay: boolean) => {},
  setShowControlsInGalleryView: (showControlsInGalleryView: boolean) => {},
  setBufferSize: (bufferSize: number) => {},
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
      setGlob: setValue("glob"),
      setRandomize: setValue("randomize"),
      setAutoplay: setValue("autoplay"),
      setShowControlsInGalleryView: setValue("showControlsInGalleryView"),
      setBufferSize: setValue("bufferSize"),
    };
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
