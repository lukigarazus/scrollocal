import { useEffect, useState } from "react";

export const useBoundingClientRect = () => {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const element = ref;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      setRect(entries[0].contentRect);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return { rect, setRef, ref };
};
