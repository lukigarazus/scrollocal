import { useSettings } from "../contexts/SettingsContext";

function BooleanControl({ name, value, setValue }: any) {
  return (
    <div>
      <label htmlFor={name}>{name}</label>
      <input
        id={name}
        type="checkbox"
        checked={value}
        onChange={() => setValue(!value)}
      />
    </div>
  );
}

export function FeedControl() {
  const {
    randomize,
    setRandomize,
    autoplay,
    setAutoplay,
    showControlsInGalleryView,
    setShowControlsInGalleryView,
  } = useSettings();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <BooleanControl
        name="Randomize"
        value={randomize}
        setValue={setRandomize}
      />
      <BooleanControl name="Autoplay" value={autoplay} setValue={setAutoplay} />
      <BooleanControl
        name="Show controls in gallery view"
        value={showControlsInGalleryView}
        setValue={setShowControlsInGalleryView}
      />
    </div>
  );
}
