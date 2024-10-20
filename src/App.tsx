import { Gallery } from "./gallery/Gallery";
import { useSettings } from "./contexts/SettingsContext";
import { Settings } from "./settings/Settings";
import { VideoEditor } from "./videoEditing/VideoEditor";
import { Tabs } from "./components/Tabs";

import "./tailwind.css";

const components = {
  gallery: Gallery,
  video: VideoEditor,
} as const;

function WithSettings({}: {}) {
  return (
    <>
      <Tabs
        headerClassName="bg-accent"
        bodyClassName="bg-bgDeep"
        tabs={[
          { label: "Gallery", id: "gallery" },
          { label: "Video", id: "video" },
        ]}
        components={components}
      />
      <Settings />
    </>

    //   <VideoEditor />
    //   <>
    //     <Gallery />
    //     <GallerySettings />
    //   </>
    // </Box>
  );
}

function App() {
  const { loading } = useSettings();

  return (
    <div className="relative h-[100vh] w-[100vw]">
      {loading ? <div>Loading settings</div> : <WithSettings />}
    </div>
  );
}

export default App;
