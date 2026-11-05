/** Kürzel eines Namens: Anfangsbuchstaben der ersten beiden Wörter, sonst die ersten beiden Zeichen (member-profiles, design.md D6). */
export function initialsOfName(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? '').slice(0, 2)).toUpperCase();
}
