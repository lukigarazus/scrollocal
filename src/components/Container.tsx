export const Container = ({ child }: { child: HTMLElement }) => {
  return (
    <div
      style={{ width: "100%", height: "100%" }}
      ref={(ref) => ref?.appendChild?.(child)}
    ></div>
  );
};
