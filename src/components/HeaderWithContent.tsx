import React from "react";

export const HeaderWithContent = ({ children }: any) => {
  const firstChild = React.Children.toArray(children)[0];
  const restChildren = React.Children.toArray(children).slice(1);
  return (
    <div className="flex size-full flex-col">
      <div className="h-[50px]">{firstChild}</div>

      {restChildren}
    </div>
  );
};
