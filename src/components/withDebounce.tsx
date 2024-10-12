import {
  PropsWithChildren,
  ComponentType,
  useEffect,
  useState,
  PropsWithoutRef,
} from "react";

const debounceMap = {} as Record<number, boolean>;

export function withDebounce<Props>(
  Component: ComponentType<PropsWithChildren<Props>>,
  delay: number,
  Placeholder: ComponentType<PropsWithoutRef<Props>> = () => null,
) {
  return function WithDebounce({
    children,
    ...props
  }: PropsWithChildren<Props>) {
    const [debounced, setDebounced] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebounced(true);
      }, delay);
      return () => {
        clearTimeout(timer);
      };
    }, []);
    // @ts-expect-error
    if (debounced) return <Component {...props}>{children}</Component>;

    // @ts-expect-error
    return <Placeholder {...props} />;
  };
}
