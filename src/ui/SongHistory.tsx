import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  copySource,
  editDiff,
  groupEdits,
  isUnchanged,
  patternIdOf,
  restoreConsequences,
  restoreTarget,
  structureChanges,
  type RestoreConsequence,
  type Edit,
  type HistoryInput,
  type RestoreScope,
} from '../domain/history';
import { DEFAULT_METER, type Pattern, type Song } from '../domain/types';
import type { HistoryStep, SongHistory as History } from '../persistence/history';
import { Breadcrumbs } from './Breadcrumbs';
import { useConfirm } from './ConfirmDialog';
import { HistoryMotif } from './HistoryMotif';
import { formatDay, formatMoment, formatTime, patternLabel, subjectKind, subjectLabel, summaryText } from './historyText';
import { LockToggle } from './lock';
import { MemberAvatar } from './MemberAvatar';
import { OldNew } from './OldNew';
import { patternStyle } from './patternStyle';
import { Sequencer } from './Sequencer';
import { useNotebook, useOpenSong, useStore } from './useLibrary';
import { useEmail } from './useWorkbooks';

/** Historie eines Songs; in der App aus dem Repository, ohne sie bleibt der Verlauf leer. */
export type HistoryOf = (songId: string) => History | null;

export const HistoryContext = createContext<HistoryOf>(() => null);

/** Eingabe der Bearbeitungen mit den Hashes der Schritte. */
type Input = HistoryInput & { steps: readonly HistoryStep[] };

/** Auswahl über Hashes, damit eintreffende Änderungen sie nicht verschieben (design.md D7). */
interface Selection {
  /** Hash des ersten Schritts der gewählten Bearbeitung. */
  edit: string | null;
  /** Hash des gewählten Schritts, `before` für den Stand vor der Bearbeitung, `null` für den letzten. */
  step: string | 'before' | null;
}

interface Person {
  email: string | null;
  name: string;
}

/** Verlauf des geöffneten Songs (song-history). */
export function SongHistory() {
  const song = useOpenSong();
  const historyOf = useContext(HistoryContext);
  const history = useMemo(() => historyOf(song.id), [historyOf, song]);
  return (
    <main className="song-history" aria-label="Verlauf">
      <header className="page-header history-header">
        <Breadcrumbs />
        <div className="page-title">
          <h2 className="editable-heading">
            <span className="heading-text">Verlauf</span>
          </h2>
          <LockToggle />
        </div>
      </header>
      {history && history.steps.length > 0 ? <HistoryBody history={history} /> : <p className="muted">Für diesen Song gibt es noch keinen Verlauf.</p>}
    </main>
  );
}

function HistoryBody({ history }: { history: History }) {
  const song = useOpenSong();
  const { placement, workbooks } = useNotebook();
  const input = useMemo<Input>(() => ({ steps: history.steps, songAt: history.songAt }), [history]);
  const edits = useMemo(() => groupEdits(input), [input]);
  const [selection, setSelection] = useState<Selection>({ edit: null, step: null });

  const workbook = workbooks.find((w) => w.id === placement[song.id]);
  const shared = workbook !== undefined && !workbook.personal;
  const personOf = (email: string | null): Person => ({
    email,
    name: email ? (workbook?.profiles?.[email]?.name ?? email) : 'Unbekannt',
  });

  const keyOf = (edit: Edit) => history.steps[edit.first]!.hash;
  const selected = edits.find((e) => keyOf(e) === selection.edit) ?? edits.at(-1)!;

  return (
    <div className="history-layout">
      <EditList
        edits={edits}
        input={input}
        selected={selected}
        shared={shared}
        personOf={personOf}
        workbookProfile={(email) => (email ? workbook?.profiles?.[email] : undefined)}
        onSelect={(edit) => setSelection({ edit: keyOf(edit), step: null })}
      />
      <EditDetail
        key={keyOf(selected)}
        edit={selected}
        input={input}
        latest={selected === edits.at(-1)}
        shared={shared}
        personOf={personOf}
        step={selection.step}
        onStep={(step) => setSelection({ edit: keyOf(selected), step })}
        onRestore={() => setSelection({ edit: null, step: null })}
      />
    </div>
  );
}

// --- Liste ----------------------------------------------------------------------------

function EditList({
  edits,
  input,
  selected,
  shared,
  personOf,
  workbookProfile,
  onSelect,
}: {
  edits: Edit[];
  input: Input;
  selected: Edit;
  shared: boolean;
  personOf: (email: string | null) => Person;
  workbookProfile: (email: string | null) => Parameters<typeof MemberAvatar>[0]['profile'];
  onSelect: (edit: Edit) => void;
}) {
  // Neueste zuerst; Tage, darin Läufe derselben Person
  const days: { day: string; runs: { author: string | null; edits: Edit[] }[] }[] = [];
  for (const edit of [...edits].reverse()) {
    const day = formatDay(input.steps[edit.last]!.time);
    let group = days.at(-1);
    if (group?.day !== day) days.push((group = { day, runs: [] }));
    const run = group.runs.at(-1);
    if (run && (!shared || run.author === edit.author)) run.edits.push(edit);
    else group.runs.push({ author: edit.author, edits: [edit] });
  }

  const item = (edit: Edit) => {
    const before = input.songAt(edit.from);
    const after = input.songAt(edit.last)!;
    const diff = editDiff(edit, input);
    const unchanged = isUnchanged(diff);
    const id = patternIdOf(edit.subject);
    const pattern = id ? (after.patterns.find((p) => p.id === id) ?? before?.patterns.find((p) => p.id === id)) : undefined;
    const label = subjectLabel(edit.subject, before, after);
    const summary =
      edit.restore !== undefined ? `Stand vom ${formatMoment(edit.restore)}` : unchanged ? 'ohne Nettoänderung' : summaryText(diff, before, after);
    const steps = edit.last - edit.first + 1;
    return (
      <li key={input.steps[edit.first]!.hash}>
        <button
          type="button"
          data-read-safe=""
          className="history-edit"
          aria-current={edit === selected || undefined}
          data-unchanged={unchanged || undefined}
          onClick={() => onSelect(edit)}
        >
          <span className="history-swatch" style={pattern ? patternStyle(pattern.color) : undefined} aria-hidden="true" />
          <span className="history-what">{edit.restore !== undefined ? `Wiederhergestellt: ${label}` : label}</span>
          <span className="history-summary">
            {summary}
            {unchanged && ` (${steps} ${steps === 1 ? 'Schritt' : 'Schritte'})`}
          </span>
          <time className="history-time">{formatTime(input.steps[edit.last]!.time)}</time>
        </button>
      </li>
    );
  };

  return (
    <ol className="history-list" aria-label="Bearbeitungen">
      {days.map(({ day, runs }) => (
        <li key={day} className="history-day">
          <h3>{day}</h3>
          {runs.map((run, r) =>
            shared ? (
              <div key={r} role="group" aria-label={personOf(run.author).name} className="history-person">
                <div className="history-person-head" aria-hidden="true">
                  {run.author ? <MemberAvatar email={run.author} profile={workbookProfile(run.author)} /> : <span className="avatar">?</span>}
                  {personOf(run.author).name}
                </div>
                <ul>{run.edits.map(item)}</ul>
              </div>
            ) : (
              <ul key={r}>{run.edits.map(item)}</ul>
            ),
          )}
        </li>
      ))}
    </ol>
  );
}

// --- Stand ----------------------------------------------------------------------------

function EditDetail({
  edit,
  input,
  latest,
  shared,
  personOf,
  step,
  onStep,
  onRestore,
}: {
  edit: Edit;
  input: Input;
  latest: boolean;
  shared: boolean;
  personOf: (email: string | null) => Person;
  step: string | 'before' | null;
  onStep: (step: string | 'before') => void;
  onRestore: () => void;
}) {
  const { locked } = useNotebook();
  const { steps } = input;
  // Positionen des Reglers: vorher (falls es einen Stand davor gibt) und jeder Schritt der Bearbeitung
  const positions: (number | 'before')[] = [...(edit.from >= 0 ? (['before'] as const) : []), ...range(edit.first, edit.last)];
  const position = step === 'before' && edit.from >= 0 ? 0 : step ? positions.findIndex((p) => p !== 'before' && steps[p]!.hash === step) : -1;
  const index = position >= 0 ? position : positions.length - 1;
  const at = positions[index]!;
  const stateIndex = at === 'before' ? edit.from : at;
  const before = input.songAt(edit.from);
  const after = input.songAt(stateIndex)!;
  const current = latest && at === edit.last && edit.last === steps.length - 1;
  const count = edit.last - edit.first + 1;
  const time = steps[stateIndex]!.time;
  const end = input.songAt(edit.last);
  const label = subjectLabel(edit.subject, before, end);
  // Die Art steht auch dann fest, wenn das Pattern im gewählten Stand (noch) nicht besteht
  const kind = subjectKind(edit.subject, after, before, end);

  const store = useStore();
  const song = useOpenSong();
  const confirm = useConfirm();
  const me = useEmail();

  /** Bestätigen lassen, dann als neue Änderung auf den aktuellen Stand (song-history, design.md D3, D6). */
  const restore = async (scope: RestoreScope) => {
    const { items, others } = restoreConsequences(song, after, edit.subject, scope, steps.slice(stateIndex + 1), me);
    const what = scope === 'song' ? 'Ganzen Song' : kind;
    const ok = await confirm({
      title: `${what} auf den Stand vom ${formatMoment(time)} setzen?`,
      content: <RestoreContent items={items} others={others.map((email) => personOf(email).name)} current={song} target={after} scope={scope} />,
      confirmLabel: 'Wiederherstellen',
      canConfirm: items.length > 0,
    });
    if (!ok) return;
    store.restoreSong(restoreTarget(song, after, edit.subject, scope, new Date()), time);
    onRestore();
  };

  const go = (next: number) => {
    const target = positions[Math.max(0, Math.min(positions.length - 1, next))]!;
    onStep(target === 'before' ? 'before' : steps[target]!.hash);
  };

  return (
    <section className="history-detail" aria-label="Stand">
      <div className="history-banner">
        <div>
          <h3>{current ? 'Aktueller Stand' : `${at === 'before' ? 'Vor dieser Bearbeitung · ' : ''}Stand vom ${formatMoment(time)}`}</h3>
          <p className="muted">
            {[label, `${count} ${count === 1 ? 'Einzelschritt' : 'Einzelschritte'}`, `${formatTime(steps[edit.first]!.time)}–${formatTime(steps[edit.last]!.time)}`, ...(shared ? [personOf(edit.author).name] : [])].join(' · ')}
          </p>
        </div>
        {!current && !locked && (
          <div className="history-actions">
            <button type="button" className="primary" onClick={() => void restore('subject')}>
              {kind} auf diesen Stand
            </button>
            <button type="button" onClick={() => void restore('song')}>
              Ganzen Song auf diesen Stand
            </button>
          </div>
        )}
      </div>

      {positions.length > 1 && (
        <div className="history-steps">
          <button type="button" data-read-safe="" aria-label="Schritt zurück" disabled={index === 0} onClick={() => go(index - 1)}>
            ‹
          </button>
          <input
            type="range"
            aria-label="Schritt"
            min={0}
            max={positions.length - 1}
            value={index}
            aria-valuetext={at === 'before' ? 'vorher' : `Schritt ${at - edit.first + 1} von ${count}`}
            onChange={(event) => go(Number(event.target.value))}
          />
          <button type="button" data-read-safe="" aria-label="Schritt vor" disabled={index === positions.length - 1} onClick={() => go(index + 1)}>
            ›
          </button>
          <span className="muted">{at === 'before' ? 'vorher' : `Schritt ${at - edit.first + 1}/${count}`}</span>
        </div>
      )}

      <Comparison edit={edit} input={input} before={before} after={after} at={stateIndex} />
    </section>
  );
}

/** Vergleich je nach Gegenstand der Bearbeitung (song-history). */
function Comparison({ edit, input, before, after, at }: { edit: Edit; input: Input; before: Song | null; after: Song; at: number }) {
  const id = patternIdOf(edit.subject);
  const songData = <SongData song={after} previous={edit.subject === 'song' ? before : null} />;
  if (edit.subject === 'song') return songData;
  if (edit.subject === 'structure') {
    const marks = structureChanges(before, after);
    return (
      <>
        {songData}
        <div className="history-columns">
          <section>
            <h4>Vorher</h4>
            {before ? <HistoryMotif song={before} marks={marks.before} label="Vorher" /> : <p className="muted">Noch keine Struktur.</p>}
          </section>
          <section>
            <h4>Nachher</h4>
            <HistoryMotif song={after} marks={marks.after} previous={before} label="Nachher" />
          </section>
        </div>
      </>
    );
  }
  const old = before?.patterns.find((p) => p.id === id);
  const now = after.patterns.find((p) => p.id === id);
  const source = old ? undefined : copySource(edit, input, id!, at);
  const base = old ?? source;
  const used = after.segments.some((s) => s.blocks.some((b) => b.bars.some((bar) => bar.grooveId === id || bar.fillId === id)));
  // Aufgeklappt, wenn die Bearbeitung die Unterteilung eines Beats geändert hat
  const end = input.songAt(edit.last)?.patterns.find((p) => p.id === id);
  const grid = (p: Pattern | undefined) => p?.beats.map((b) => b.subdivision).join();
  const regridded = old !== undefined && end !== undefined && grid(old) !== grid(end);
  return (
    <>
      {songData}
      {now && <PatternProps pattern={now} previous={old} />}
      {/* Ein Bereich für beide, damit sie gemeinsam scrollen und die Beats übereinander stehen */}
      <div className="history-sequencers">
        <details className="history-previous" open={regridded}>
          <summary>{source ? `Vorlage „${source.name}“` : 'Vorher'}</summary>
          {base ? <Sequencer pattern={base} readOnly compact /> : <p className="muted">Bestand vorher nicht.</p>}
        </details>
        <h4>Nachher</h4>
        {now ? <Sequencer pattern={now} compare={base} readOnly compact /> : <p className="muted">{old ? 'Gelöscht.' : 'Bestand noch nicht.'}</p>}
      </div>
      <h4>Verwendung im Song</h4>
      {used ? (
        <HistoryMotif song={after} patternId={id!} />
      ) : (
        <p role="note" className="muted">
          In diesem Stand keinem Takt zugeordnet.
        </p>
      )}
    </>
  );
}

function Value({ label, children }: { label: string; children: ReactNode }) {
  return (
    <li>
      <span className="history-key">{label}</span> {children}
    </li>
  );
}

function SongData({ song, previous }: { song: Song; previous: Song | null }) {
  const show = <T,>(from: T | undefined, to: T, text: (v: T) => string) =>
    previous && from !== to ? <OldNew from={text(from as T)} to={text(to)} /> : text(to);
  return (
    <ul className="history-values" aria-label="Song-Daten">
      <Value label="Titel">{show(previous?.title, song.title, String)}</Value>
      <Value label="Tempo">{show(previous?.tempo, song.tempo, (v) => `${v} BPM`)}</Value>
      <Value label="Takt">{show(previous?.meter ?? DEFAULT_METER, song.meter ?? DEFAULT_METER, (v) => `${v}/4`)}</Value>
    </ul>
  );
}

function PatternProps({ pattern, previous }: { pattern: Pattern; previous: Pattern | undefined }) {
  const show = <T,>(from: T | undefined, to: T, text: (v: T) => ReactNode) =>
    previous && from !== to ? <OldNew from={text(from as T)} to={text(to)} /> : text(to);
  const swatch = (p: Pattern) => <span className="history-swatch" style={patternStyle(p.color)} aria-label={p.color} />;
  const meter = (m: number | undefined) => (m ? `${m}/4` : 'wie Song');
  return (
    <ul className="history-values" aria-label="Eigenschaften">
      <Value label="Name">{show(previous?.name, pattern.name, String)}</Value>
      <Value label="Länge">{show(previous?.beats.length, pattern.beats.length, (v) => `${v} Beats`)}</Value>
      <Value label="Farbe">{previous && previous.color !== pattern.color ? <OldNew from={swatch(previous)} to={swatch(pattern)} /> : swatch(pattern)}</Value>
      <Value label="Taktart">{show(previous ? (previous.meter ?? 0) : undefined, pattern.meter ?? 0, (v) => meter(v || undefined))}</Value>
    </ul>
  );
}

const usesOf = (song: Song, id: string) =>
  song.segments.some((s) => s.blocks.some((b) => b.bars.some((bar) => bar.grooveId === id || bar.fillId === id)));

/** Folgen einer Wiederherstellung im Bestätigungsdialog (song-history › Bestätigung des Wiederherstellens). */
function RestoreContent({
  items,
  others,
  current,
  target,
  scope,
}: {
  items: RestoreConsequence[];
  others: string[];
  current: Song;
  target: Song;
  scope: RestoreScope;
}) {
  if (items.length === 0) return <p>Der aktuelle Stand entspricht bereits diesem Stand; es ändert sich nichts.</p>;
  const pattern = (id: string) => (current.patterns.find((p) => p.id === id) ?? target.patterns.find((p) => p.id === id))!;
  const structure = items.some((item) => item.type === 'structure');
  const text = (item: RestoreConsequence): ReactNode => {
    switch (item.type) {
      case 'song':
        return (
          <>
            {item.title && <>Titel: <OldNew from={item.title.from} to={item.title.to} /> </>}
            {item.tempo && <>Tempo: <OldNew from={`${item.tempo.from} BPM`} to={`${item.tempo.to} BPM`} /> </>}
            {item.meter && <>Takt: <OldNew from={`${item.meter.from}/4`} to={`${item.meter.to}/4`} /></>}
          </>
        );
      case 'structure':
        return 'Die Struktur wird zurückgesetzt.';
      case 'reset': {
        const now = current.patterns.find((p) => p.id === item.patternId)!;
        const then = target.patterns.find((p) => p.id === item.patternId)!;
        return `${patternLabel(now)} wird zurückgesetzt${now.name !== then.name ? ` und heißt wieder „${then.name}“` : ''}.`;
      }
      case 're-added':
        if (scope === 'subject' && structure) return `${patternLabel(pattern(item.patternId))} wird wieder angelegt, weil die Struktur es nutzt.`;
        return `${patternLabel(pattern(item.patternId))} wird wieder angelegt${scope === 'subject' && usesOf(target, item.patternId) ? '; seine früheren Taktzuordnungen kommen nicht zurück' : ''}.`;
      case 'deleted':
        return `${patternLabel(pattern(item.patternId))} wird gelöscht${scope === 'subject' && usesOf(current, item.patternId) ? '; Takte, die es nutzen, verlieren es' : ''}.`;
    }
  };
  const rest =
    scope === 'song' ? null : items.some((i) => i.type === 'reset' || i.type === 're-added' || i.type === 'deleted') && !structure
      ? 'Struktur und andere Patterns bleiben, wie sie sind.'
      : structure
        ? 'Die Patterns ändern sich sonst nicht.'
        : null;
  return (
    <>
      <ul className="dialog-list">
        {items.map((item, i) => (
          <li key={i}>{text(item)}</li>
        ))}
        {rest && <li>{rest}</li>}
      </ul>
      {others.length > 0 && (
        <p role="note" className="message note">
          Darin enthaltene Änderungen von {others.join(', ')} seit diesem Stand werden zurückgenommen.
        </p>
      )}
      <p className="muted">Wiederherstellung wird als neue Änderung auf dem aktuellen Stand ausgeführt.</p>
    </>
  );
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
