import { useState, type CSSProperties } from 'react';
import { allBars } from '../domain/songPatterns';
import { appendBlock, deleteSegment, duplicateSegment, moveSegment, renameSegment } from '../domain/structure';
import type { Song } from '../domain/types';
import { layoutStructure, type FillItem, type Item, type Row } from '../songbook/layout';
import { BarInspector } from './BarInspector';
import { useConfirm } from './ConfirmDialog';
import { NotationView } from './NotationView';
import { isEmptyPattern } from './PatternPage';
import { patternStyle } from './patternStyle';
import { StructureToolbar } from './StructureToolbar';
import { useOpenSong, useStore } from './useLibrary';

/** Position und Breite in Beats als CSS (Einheit --beat). */
const place = (x: number, width?: number): CSSProperties => ({
  left: `calc(var(--beat) * ${x})`,
  ...(width !== undefined ? { width: `calc(var(--beat) * ${width})` } : {}),
});

function FillBlock({ item, song }: { item: FillItem; song: Song }) {
  const pattern = song.patterns.find((p) => p.id === item.patternId)!;
  const classes = ['item', 'fill', item.continuesLeft && 'continues-left', item.continuesRight && 'continues-right'];
  return (
    <div className={classes.filter(Boolean).join(' ')} style={{ ...place(item.x, item.width), ...patternStyle(item.color) }}>
      {item.barlines.map((x) => (
        <span key={x} className="inner-barline" style={place(x - item.x)} />
      ))}
      {item.mini ? (
        <>
          <span className="visually-hidden">{item.label}</span>
          {!isEmptyPattern(pattern) && <NotationView pattern={pattern} compact />}
        </>
      ) : (
        <span className="item-label">{item.label}</span>
      )}
    </div>
  );
}

function RowItem({ item, song }: { item: Item; song: Song }) {
  switch (item.kind) {
    case 'groove':
      return (
        <div className="item groove" style={{ ...place(item.x, item.width), ...patternStyle(item.color) }}>
          <span className="item-label">{item.label}</span>
          {item.startBeat !== null && <span className="start-beat">ab {item.startBeat}</span>}
        </div>
      );
    case 'empty':
      return <div className="item empty" style={place(item.x, item.width)} />;
    case 'fill':
      return <FillBlock item={item} song={song} />;
    case 'accent':
      return (
        <span className="accent" style={place(item.x)}>
          {item.label}
        </span>
      );
  }
}

interface Selection {
  selected: ReadonlySet<string>;
  onSelect: (barId: string, extend: boolean) => void;
}

function StructureRow({ row, song, selection }: { row: Row; song: Song; selection: Selection }) {
  return (
    <div className="structure-row" style={{ width: `calc(var(--beat) * ${row.width})` }}>
      {row.bars.map((bar) => (
        <button
          key={bar.barId}
          type="button"
          className={`bar-frame${bar.blockStart ? ' block-start' : ''}`}
          style={place(bar.x, bar.width)}
          aria-label={`Takt ${bar.index + 1}`}
          aria-pressed={selection.selected.has(bar.barId)}
          onClick={(e) => selection.onSelect(bar.barId, e.shiftKey)}
        >
          <span className="bar-number">{bar.index + 1}</span>
        </button>
      ))}
      {row.items.map((item, i) => (
        <RowItem key={i} item={item} song={song} />
      ))}
    </div>
  );
}

function SegmentHeader({ segmentId, name, first, last }: { segmentId: string; name: string; first: boolean; last: boolean }) {
  const store = useStore();
  const confirm = useConfirm();
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  const commit = () => {
    store.updateSong((s) => renameSegment(s, segmentId, draft));
    setRenaming(false);
  };

  return (
    <div className="segment-header">
      {renaming ? (
        <input
          className="segment-rename"
          aria-label={`Neuer Name für ${name}`}
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
      ) : (
        <h3 className="segment-name">{name}</h3>
      )}
      <div className="segment-actions">
        <button type="button" aria-label={`${name} umbenennen`} onClick={() => (setDraft(name), setRenaming(true))}>
          ✎
        </button>
        <button type="button" aria-label={`${name} nach oben`} disabled={first} onClick={() => store.updateSong((s) => moveSegment(s, segmentId, -1))}>
          ↑
        </button>
        <button type="button" aria-label={`${name} nach unten`} disabled={last} onClick={() => store.updateSong((s) => moveSegment(s, segmentId, 1))}>
          ↓
        </button>
        <button type="button" aria-label={`${name} duplizieren`} onClick={() => store.updateSong((s) => duplicateSegment(s, segmentId))}>
          ⧉
        </button>
        <button
          type="button"
          aria-label={`Block an ${name} anfügen`}
          onClick={() => store.updateSong((s) => appendBlock(s, segmentId, { bars: 4 }))}
        >
          + Block
        </button>
        <button
          type="button"
          className="danger"
          aria-label={`${name} löschen`}
          onClick={async () => {
            if (await confirm(`Segment „${name}“ mit allen Takten löschen?`)) store.updateSong((s) => deleteSegment(s, segmentId));
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

/** Taktauswahl: Klick wählt einen Takt, Shift+Klick einen Bereich in Songreihenfolge. */
function useBarSelection(song: Song) {
  const [selected, setSelected] = useState<string[]>([]);
  const [anchor, setAnchor] = useState<string | null>(null);
  const order = allBars(song).map((b) => b.id);
  const existing = selected.filter((id) => order.includes(id));

  const onSelect = (barId: string, extend: boolean) => {
    if (extend && anchor && order.includes(anchor)) {
      const [from, to] = [order.indexOf(anchor), order.indexOf(barId)].sort((a, b) => a - b);
      setSelected(order.slice(from!, to! + 1));
    } else {
      setSelected([barId]);
      setAnchor(barId);
    }
  };
  return { selected: existing, onSelect, clear: () => setSelected([]) };
}

/** Linke Buchseite: die Song-Struktur maßstabsgetreu (design.md D3) mit Editor (D7). */
export function StructurePage() {
  const song = useOpenSong();
  const layout = layoutStructure(song);
  const { selected, onSelect, clear } = useBarSelection(song);
  const selection: Selection = { selected: new Set(selected), onSelect };

  return (
    <section className="page structure-page" aria-label="Struktur">
      <StructureToolbar />
      {layout.length === 0 && <p className="hint">Noch keine Struktur. Lege das erste Segment an.</p>}
      {layout.map((segment, i) => (
        <div key={segment.segmentId} className="segment">
          <SegmentHeader segmentId={segment.segmentId} name={segment.name} first={i === 0} last={i === layout.length - 1} />
          {segment.rows.map((row, r) => (
            <StructureRow key={r} row={row} song={song} selection={selection} />
          ))}
        </div>
      ))}
      <BarInspector selection={selected} onDeleted={clear} />
    </section>
  );
}
