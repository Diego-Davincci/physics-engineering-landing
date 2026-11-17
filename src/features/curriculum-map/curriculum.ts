/**
 * Turns the curriculum collections into the semesters the map draws.
 * Pure (no Astro runtime, type imports only) so it can be unit-tested.
 */
import type { CollectionEntry } from 'astro:content';

/** A group as the map needs it. */
export interface Group {
  id: string;
  /** Official name. */
  name: string;
  /** Short name for cards and the legend. */
  label: string;
  /** True when students choose courses from the group. */
  elective: boolean;
}

/** One card on the map. */
export type Card =
  | { kind: 'course'; key: string; code: string; name: string; credits: number; group: Group }
  /** A seat for any course of an elective group, e.g. "Optativa II · Instrumentación". */
  | { kind: 'elective'; key: string; name: string; credits: number; group: Group }
  /** A seat for any course of the university (libre elección). */
  | { kind: 'free'; key: string; name: string; credits: number };

/** One column of the map. */
export interface Semester {
  /** 1-based semester number. */
  number: number;
  /** Roman numeral shown in the header. */
  numeral: string;
  /** Sum of the credits of its cards. */
  credits: number;
  cards: Card[];
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];

/**
 * @param groups - group collection entries
 * @returns plain groups, in file order
 */
export function toGroups(groups: CollectionEntry<'groups'>[]): Group[] {
  return groups.map(({ id, data }) => ({ id, name: data.name, label: data.label, elective: data.elective }));
}

/**
 * Joins the study plan with its courses and groups.
 * @param plan - study-plan entries, one per semester (id "1"…"10")
 * @param courses - every course of the program
 * @param groups - every course group
 * @returns semesters in order, each with its cards and credit total
 */
export function buildSemesters(
  plan: CollectionEntry<'studyPlan'>[],
  courses: CollectionEntry<'courses'>[],
  groups: CollectionEntry<'groups'>[],
): Semester[] {
  const groupById = new Map(toGroups(groups).map((g) => [g.id, g]));
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const group = (id: string) => groupById.get(id)!;

  /** Elective seats are numbered per group across the whole plan: Optativa I, II, III… */
  const electiveCount = new Map<string, number>();

  return [...plan]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map(({ id, data }) => {
      const number = Number(id);
      const cards = data.slots.map((slot, i): Card => {
        const key = `${number}-${i}`;
        if (slot.type === 'course') {
          const { data: course } = courseById.get(slot.course.id)!;
          return { kind: 'course', key, code: slot.course.id, name: course.name, credits: course.credits, group: group(course.group.id) };
        }
        if (slot.type === 'elective') {
          const n = (electiveCount.get(slot.group.id) ?? 0) + 1;
          electiveCount.set(slot.group.id, n);
          return { kind: 'elective', key, name: `Optativa ${NUMERALS[n - 1]}`, credits: slot.credits, group: group(slot.group.id) };
        }
        return { kind: 'free', key, name: 'Libre elección', credits: slot.credits };
      });
      const credits = cards.reduce((sum, card) => sum + card.credits, 0);
      return { number, numeral: NUMERALS[number - 1], credits, cards };
    });
}

