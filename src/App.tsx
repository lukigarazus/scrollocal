import { Gallery } from "./gallery/Gallery";
import { useSettings } from "./contexts/SettingsContext";
import { Settings } from "./settings/Settings";

import "./App.css";

function WithSettings({}: {}) {
  return (
    <>
      <Gallery />
      <Settings />
    </>
  );
}

function App() {
  const { loading } = useSettings();

  return (
    <div style={{ position: "relative" }}>
      {loading ? <div>Loading settings</div> : <WithSettings />}
    </div>
  );
}

export default App;
