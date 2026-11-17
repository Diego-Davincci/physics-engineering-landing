/**
 * Prerequisite graph of the program: what each course needs, what it is taken with and
 * what it unlocks. Pure TS (no Astro, no DOM) so it can be unit-tested.
 */

/** A course's links as stored in courses.json (ids only). */
export interface CourseLinks {
  id: string;
  /** Courses that must be passed first. */
  prerequisites: string[];
  /** Courses taken in the same semester (may be written on only one side). */
  corequisites: string[];
}

/** A course's links, resolved in both directions. */
export interface Relations {
  /** Courses that must be passed before this one. */
  prerequisites: string[];
  /** Courses taken together with this one, whichever side declared it. */
  corequisites: string[];
  /** Courses that list this one as a prerequisite. */
  unlocks: string[];
}

/**
 * Builds every course's relations. Lists keep the input order and have no duplicates.
 * @param courses - every course with its declared links
 * @returns relations by course id (every input course has an entry, even with no links)
 */
export function buildGraph(courses: CourseLinks[]): Map<string, Relations> {
  const graph = new Map<string, Relations>();
  for (const { id } of courses) graph.set(id, { prerequisites: [], corequisites: [], unlocks: [] });

  const add = (list: string[], id: string) => {
    if (!list.includes(id)) list.push(id);
  };

  for (const course of courses) {
    const own = graph.get(course.id)!;
    for (const pre of course.prerequisites) {
      add(own.prerequisites, pre);
      const target = graph.get(pre);
      if (target) add(target.unlocks, course.id);
    }
    for (const co of course.corequisites) {
      add(own.corequisites, co);
      const target = graph.get(co);
      if (target) add(target.corequisites, course.id);
    }
  }

  // Corequisites declared on the other side land at the end of the list; keep input order instead.
  const order = new Map(courses.map(({ id }, i) => [id, i]));
  const byInput = (a: string, b: string) => (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity);
  for (const relations of graph.values()) relations.corequisites.sort(byInput);

  return graph;
}
