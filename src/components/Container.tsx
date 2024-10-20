export const Container = ({ child }: { child: HTMLElement }) => {
  return <div className="" ref={(ref) => ref?.appendChild?.(child)}></div>;
};
