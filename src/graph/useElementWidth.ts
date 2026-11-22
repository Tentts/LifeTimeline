import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Width of an element in CSS pixels, kept up to date with ResizeObserver.
 * Returns null until measured, or when ResizeObserver isn't available (then callers
 * fall back to the desktop layout).
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number | null {
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}
