import { invoke } from "@tauri-apps/api/core";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useState,
  useEffect,
} from "react";

const HttpContext = createContext<{ port: number | null }>({ port: null });

export const useHttp = () => {
  return useContext(HttpContext);
};

export const HttpContextProvider = ({ children }: PropsWithChildren) => {
  const [port, setPort] = useState<number | null>(null);
  useEffect(() => {
    invoke("get_http_port").then((port) => setPort(port as number));
  }, []);
  return (
    <HttpContext.Provider value={{ port }}>{children}</HttpContext.Provider>
  );
};
