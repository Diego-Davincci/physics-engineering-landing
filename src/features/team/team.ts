/** Pure helpers for the team section. */

/** Academic prefixes that never count toward the initials. */
const PREFIXES = new Set(['prof.', 'dr.', 'dra.', 'ing.']);

/**
 * Monogram for an ID card: first given name + first surname.
 * Spanish names carry two surnames, so with four words the first surname is the third
 * ("Jairo Humberto Marín Cadavid" → "JM"); with two or three it is the second
 * ("Nerio Montoya" → "NM"). A single name gives one letter ("Mónica" → "M").
 * @param name Full name, optionally with a prefix such as "Prof.".
 */
export function initials(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word && !PREFIXES.has(word.toLowerCase()));
  if (words.length === 0) return '';
  if (words.length === 1) return words[0][0].toUpperCase();
  const surname = words.length >= 4 ? words[2] : words[1];
  return (words[0][0] + surname[0]).toUpperCase();
}

/** Resting tilts of the hanging cards, in degrees, repeated in order. */
const RESTING_TILTS = [-1.5, 1.2, -0.8, 1.6];

/**
 * How a card hangs and swings in: its resting tilt and the initial push of the swing.
 * Neighbors are pushed to opposite sides so the row never moves in lockstep.
 * @param index Position of the card in the row (0-based).
 */
export function swing(index: number): { rest: number; kick: number } {
  return { rest: RESTING_TILTS[index % RESTING_TILTS.length], kick: index % 2 === 0 ? 4 : -4 };
}
