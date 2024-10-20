import { PropsWithChildren, ComponentProps } from "react";

export const Box = ({
  children,
  setRef,
  className,
  scroll,
  ...props
}: PropsWithChildren<
  {
    setRef?: (ref: HTMLDivElement | null) => void;
    className?: string;
    scroll?: boolean;
  } & ComponentProps<"div">
>) => {
  return (
    <div
      {...props}
      className={`${className} box-border size-full flex flex-col justify-center items-center max-w-full max-h-full ${scroll ? "overflow-auto" : ""}`}
      ref={setRef}
    >
      {children}
    </div>
  );
};
