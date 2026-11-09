/** Wert als Text, entsperrt mit einer unsichtbaren Auswahl darüber: Der Text bestimmt die Breite, jedes Gerät öffnet seine eigene Auswahlliste. */
export function ValueSelect({
  className,
  text,
  name,
  title,
  value,
  options,
  readOnly,
  onChange,
}: {
  className: string;
  text: string;
  name: string;
  title?: string;
  value: number;
  options: readonly { value: number; label: string }[];
  readOnly: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <span className={`value-select ${className}`} title={title}>
      <span aria-hidden={readOnly ? undefined : true}>{text}</span>
      {!readOnly && (
        <select aria-label={name} value={value} onChange={(e) => onChange(Number(e.target.value))}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </span>
  );
}
