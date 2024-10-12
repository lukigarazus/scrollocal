import { useRecordHotkeys } from "react-hotkeys-hook";

const mapStringKeyToSymbolIfPossible = (key: string) => {
  return key;
};

export function Hotkey({ value }: { value: Set<string> }) {
  return (
    <div>
      {Array.from(value).map(mapStringKeyToSymbolIfPossible).join(" + ")}
    </div>
  );
}

export function RecordHotkeys({
  onChange,
  value = new Set(),
}: {
  onChange: (keys: Set<string>) => void;
  value?: Set<string>;
}) {
  const [keys, { start, stop, isRecording }] = useRecordHotkeys();

  return (
    <div
      tabIndex={0}
      style={{
        padding: "5px",
        height: "50px",
        minWidth: "50px",
        background: "darkgrey",
        opacity: "0.9",
        borderRadius: "5px",
        border: isRecording ? "1px solid blue" : "none",
        boxSizing: "border-box",
        outline: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => {
        start();
      }}
      onBlur={() => {
        if (isRecording) {
          onChange(keys);
          stop();
        }
      }}
    >
      {<Hotkey value={isRecording ? keys : value} />}
    </div>
  );
}
