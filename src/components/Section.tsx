import { ComponentType } from "react";

export function Sections({ children }: any) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
      }}
    >
      {children}
    </div>
  );
}

export function Section({
  name,
  children,
  as,
}: {
  name: string;
  children: any;
  as?: ComponentType;
}) {
  const Component = as ? as : (props: any) => <h1 {...props}>{name}</h1>;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "5px",
        padding: "10px",
        border: "1px solid #f6f6f6",
      }}
    >
      <Component>{name}</Component>

      {children}
    </div>
  );
}
