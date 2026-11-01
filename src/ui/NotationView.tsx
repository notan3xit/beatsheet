import { useEffect, useMemo, useRef, useState } from 'react';
import type { Pattern } from '../domain/types';
import { toNotation } from '../notation/model';
import { renderNotation } from '../notation/render/vexflow';

/** Verfügbare Breite des Elements; ohne Layout (jsdom) undefined. */
function useWidth(ref: React.RefObject<HTMLElement | null>): number | undefined {
  const [width, setWidth] = useState<number>();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry!.contentRect.width) || undefined));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

export function NotationView({ pattern, compact = false }: { pattern: Pattern; compact?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const model = useMemo(() => toNotation(pattern), [pattern]);
  const width = useWidth(container);

  useEffect(() => {
    if (container.current) renderNotation(model, container.current, { compact, maxWidth: width });
  }, [model, compact, width]);

  return (
    <div
      ref={container}
      className={compact ? 'notation-mini' : 'notation'}
      role="img"
      aria-label={`Noten: ${pattern.name}`}
    />
  );
}
