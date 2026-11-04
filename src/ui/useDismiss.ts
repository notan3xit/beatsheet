import { useEffect, type RefObject } from 'react';

/**
 * Schließt ein offenes Popover bei Klick außerhalb von `area` und mit Escape.
 * Während einer Nachfrage bleibt es offen: Sie gehört zu seiner Aktion.
 */
export function useDismiss(open: boolean, area: RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const asking = () => document.querySelector('[role="alertdialog"]') !== null;
    const onPointerDown = (e: PointerEvent) => {
      if (!asking() && !area.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !asking()) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, area, close]);
}
