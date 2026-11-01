import { useEffect, useMemo, useRef } from 'react';
import type { Pattern } from '../domain/types';
import { toNotation } from '../notation/model';
import { renderNotation } from '../notation/render/vexflow';

export function NotationView({ pattern }: { pattern: Pattern }) {
  const container = useRef<HTMLDivElement>(null);
  const model = useMemo(() => toNotation(pattern), [pattern]);

  useEffect(() => {
    if (container.current) renderNotation(model, container.current);
  }, [model]);

  return <div ref={container} className="notation" role="img" aria-label={`Noten: ${pattern.name}`} />;
}
