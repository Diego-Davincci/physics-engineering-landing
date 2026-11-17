/**
 * Turns the curriculum collections into the semesters the map draws.
 * Pure (no Astro runtime, type imports only) so it can be unit-tested.
 */
import type { CollectionEntry } from 'astro:content';
import { buildGraph } from './graph';

/** A group as the map needs it. */
export interface Group {
  id: string;
  /** Official name. */
  name: string;
  /** Short name for cards and the legend. */
  label: string;
  /** Curricular component the group's credits count toward. */
  component: 'foundation' | 'professional';
  /** True when students choose courses from the group. */
  elective: boolean;
}

/** Another course, as named in a card's relations. */
export interface CourseRef {
  code: string;
  name: string;
}

/** One card on the map. */
export type Card =
  | {
      kind: 'course';
      key: string;
      code: string;
      name: string;
      credits: number;
      group: Group;
      /** Roman numeral of the semester it sits in. */
      semester: string;
      /** What it needs, what it is taken with and what it unlocks. */
      relations: { prerequisites: CourseRef[]; corequisites: CourseRef[]; unlocks: CourseRef[] };
      /** A condition that is not a course, e.g. a minimum of passed credits. */
      requirement?: string;
    }
  /** A seat for any course of an elective group, e.g. "Optativa II · Instrumentación". */
  | {
      kind: 'elective';
      key: string;
      name: string;
      credits: number;
      group: Group;
      /** Credits the plan asks for from this group, across all its seats. */
      groupCredits: number;
    }
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
  return groups.map(({ id, data }) => ({
    id,
    name: data.name,
    label: data.label,
    component: data.component,
    elective: data.elective,
  }));
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

  const graph = buildGraph(
    courses.map(({ id, data }) => ({
      id,
      prerequisites: data.prerequisites.map((ref) => ref.id),
      corequisites: data.corequisites.map((ref) => ref.id),
    })),
  );
  const refs = (ids: string[]): CourseRef[] => ids.map((id) => ({ code: id, name: courseById.get(id)!.data.name }));

  const ordered = [...plan].sort((a, b) => Number(a.id) - Number(b.id));

  /** Credits of every elective seat, per group. */
  const electiveCredits = new Map<string, number>();
  for (const { data } of ordered) {
    for (const slot of data.slots) {
      if (slot.type === 'elective') electiveCredits.set(slot.group.id, (electiveCredits.get(slot.group.id) ?? 0) + slot.credits);
    }
  }

  /** Elective seats are numbered per group across the whole plan: Optativa I, II, III… */
  const electiveCount = new Map<string, number>();

  return ordered.map(({ id, data }) => {
    const number = Number(id);
    const numeral = NUMERALS[number - 1];
    const cards = data.slots.map((slot, i): Card => {
      const key = `${number}-${i}`;
      if (slot.type === 'course') {
        const code = slot.course.id;
        const { data: course } = courseById.get(code)!;
        const links = graph.get(code)!;
        return {
          kind: 'course',
          key,
          code,
          name: course.name,
          credits: course.credits,
          group: group(course.group.id),
          semester: numeral,
          relations: {
            prerequisites: refs(links.prerequisites),
            corequisites: refs(links.corequisites),
            unlocks: refs(links.unlocks),
          },
          requirement: course.requirement,
        };
      }
      if (slot.type === 'elective') {
        const n = (electiveCount.get(slot.group.id) ?? 0) + 1;
        electiveCount.set(slot.group.id, n);
        return {
          kind: 'elective',
          key,
          name: `Optativa ${NUMERALS[n - 1]}`,
          credits: slot.credits,
          group: group(slot.group.id),
          groupCredits: electiveCredits.get(slot.group.id)!,
        };
      }
      return { kind: 'free', key, name: 'Libre elección', credits: slot.credits };
    });
    const credits = cards.reduce((sum, card) => sum + card.credits, 0);
    return { number, numeral, credits, cards };
  });
}
