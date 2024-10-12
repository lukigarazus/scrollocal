import { confirm } from "@tauri-apps/plugin-dialog";

export const withConfirm = (
  message: string,
  payload: { title: string; kind: "warning" },
  callback: () => void,
) => {
  confirm(message, payload).then((answer) => answer && callback());
};
