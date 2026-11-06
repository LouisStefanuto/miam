/**
 * Title to display for a recipe: words typed in capitals (often from an imported caption)
 * keep only their first letter capitalised, e.g. "POULET basquaise" -> "Poulet basquaise".
 * Other words are left as typed. Hyphenated parts count as words: "SAINT-JACQUES" -> "Saint-Jacques".
 */
export function displayTitle(title: string): string {
  return title.replace(/[^\s-]+/g, (word) =>
    isAllCaps(word) ? word.replace(/^(\P{L}*\p{L})(.*)$/su, (_, head, rest) => head + rest.toLowerCase()) : word,
  );
}

function isAllCaps(word: string): boolean {
  const letters = word.replace(/\P{L}/gu, '');
  return letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
}
