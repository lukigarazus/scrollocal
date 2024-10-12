import { createContext, useContext } from "react";

const ContextContext = createContext<{}>({});

export const ContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ContextContext.Provider value={{}}>{children}</ContextContext.Provider>
  );
};

export const useContextContext = () => {
  return useContext(ContextContext);
};
