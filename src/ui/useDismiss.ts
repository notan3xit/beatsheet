import { useEffect, type RefObject } from 'react';

const asking = () => document.querySelector('[role="alertdialog"]') !== null;

/** Escape, gleich wo der Fokus liegt. Während einer Nachfrage gehört die Taste ihr. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !asking()) onEscape();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active, onEscape]);
}

/**
 * Schließt ein offenes Popover bei Klick außerhalb von `area` und mit Escape.
 * Während einer Nachfrage bleibt es offen: Sie gehört zu seiner Aktion.
 */
export function useDismiss(open: boolean, area: RefObject<HTMLElement | null>, close: () => void) {
  useEscape(open, close);
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!asking() && !area.current?.contains(e.target as Node)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, area, close]);
}
