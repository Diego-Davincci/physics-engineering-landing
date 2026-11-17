/**
 * Color of each course group on the map ("Por agrupación" palette, from the Malla v0.3 prototype).
 * Uses Fósforo tokens where the prototype color matches one; the rest are Tailwind built-ins.
 * Class strings are written out in full so Tailwind can find them.
 */

/** Tailwind classes for one group. */
export interface GroupStyle {
  /** Card and swatch border. */
  border: string;
  /** Card and swatch background. */
  bg: string;
  /** Group label on the card. */
  text: string;
}

const styles: Record<string, GroupStyle> = {
  math: { border: 'border-ch1-strong', bg: 'bg-ch1-deep', text: 'text-blue-300' },
  physics: { border: 'border-phosphor', bg: 'bg-cyan-950', text: 'text-cyan-200' },
  chemistry: { border: 'border-amber-400', bg: 'bg-amber-950', text: 'text-amber-200' },
  computing: { border: 'border-teal-400', bg: 'bg-teal-950', text: 'text-teal-200' },
  'basic-science': { border: 'border-ice', bg: 'bg-carbon', text: 'text-ice' },
  design: { border: 'border-ch2-strong', bg: 'bg-ch2-deep', text: 'text-ch2-soft' },
  'professional-physics': { border: 'border-ch4-strong', bg: 'bg-ch4-deep', text: 'text-ch4-soft' },
  electronics: { border: 'border-ch3-strong', bg: 'bg-ch3-deep', text: 'text-ch3-soft' },
  thesis: { border: 'border-parchment', bg: 'bg-stone-950', text: 'text-parchment' },
  instrumentation: { border: 'border-orange-400', bg: 'bg-orange-950', text: 'text-orange-200' },
  economics: { border: 'border-pink-400', bg: 'bg-pink-950', text: 'text-pink-200' },
};

/** Legend order: required groups first, then the elective ones (as in the prototype). */
const order = [
  'math',
  'physics',
  'chemistry',
  'computing',
  'design',
  'professional-physics',
  'electronics',
  'thesis',
  'basic-science',
  'instrumentation',
  'economics',
];

/**
 * Sort comparator for groups by legend order (collections don't keep file order).
 * @param a - first group id
 * @param b - second group id
 */
export const byGroupOrder = (a: string, b: string): number => order.indexOf(a) - order.indexOf(b);

/** Free-choice seats (libre elección) have no group: dashed and neutral. */
export const freeStyle: GroupStyle = { border: 'border-subtle', bg: 'bg-transparent', text: 'text-muted' };

/**
 * @param groupId - id from groups.json
 * @returns the group's classes; throws at build time if a new group has no color yet
 */
export function groupStyle(groupId: string): GroupStyle {
  const style = styles[groupId];
  if (!style) throw new Error(`curriculum-map: group "${groupId}" has no color in group-styles.ts`);
  return style;
}
