import { PropsWithChildren } from "react";

export const Card = ({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) => {
  return (
    <div
      className={`w-full max-w-full max-h-full flex flex-col justify-center items-center p-2 rounded-md bg-bgFront box-border overflow-auto ${className}`}
    >
      {children}
    </div>
  );
};
