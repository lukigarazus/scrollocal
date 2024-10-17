import { open } from "@tauri-apps/plugin-dialog";

export function FilePicker({
  text = "Open file",
  onSelect,
}: {
  text?: string;
  onSelect: (files: string[]) => void;
}) {
  return (
    <div>
      <button
        onClick={async () => {
          const selectedFiles = await open({
            multiple: true,
          });

          if (selectedFiles) {
            onSelect(selectedFiles);
          }
        }}
      >
        {text}
      </button>
    </div>
  );
}
