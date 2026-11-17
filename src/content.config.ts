/**
 * Content Collections. Each JSON file is validated against its schema at build time,
 * so a typo in a course code or a group id fails the build instead of drawing a broken card.
 */
import { defineCollection, reference } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

/** Official course groups ("agrupaciones") of Acuerdo 0014 de 2025. */
const groups = defineCollection({
  loader: file('src/content/curriculum/groups.json'),
  schema: z.object({
    /** Official name. */
    name: z.string(),
    /** Short name for cards and the legend. */
    label: z.string(),
    /** Curricular component the group's credits count toward. */
    component: z.enum(['foundation', 'professional']),
    /** True when students pick courses from the group instead of taking all of them. */
    elective: z.boolean(),
  }),
});

/** Every course of the program. The entry id is the official course code. */
const courses = defineCollection({
  loader: file('src/content/curriculum/courses.json'),
  schema: z.object({
    name: z.string(),
    credits: z.number().int().positive(),
    group: reference('groups'),
    /** Courses that must be passed before this one. */
    prerequisites: z.array(reference('courses')),
    /** Courses taken in the same semester as this one. */
    corequisites: z.array(reference('courses')),
    /** A condition that is not a course (e.g. Trabajo de Grado's minimum credits), as written in the Acuerdo. */
    requirement: z.string().optional(),
  }),
});

/** One card position in the suggested semester plan. */
const slot = z.discriminatedUnion('type', [
  z.object({ type: z.literal('course'), course: reference('courses') }),
  /** A seat filled with any course of an elective group. */
  z.object({ type: z.literal('elective'), group: reference('groups'), credits: z.number().int().positive() }),
  /** A seat filled with any course of the university (libre elección). */
  z.object({ type: z.literal('free'), credits: z.number().int().positive() }),
]);

/**
 * Suggested order of the program: one entry per semester (id "1"…"10"), cards top to bottom.
 * Comes from the previous curriculum map and is pending validation.
 */
const studyPlan = defineCollection({
  loader: file('src/content/curriculum/study-plan.json'),
  schema: z.object({ slots: z.array(slot) }),
});

/**
 * Lab equipment students can borrow (Laboratorio de Física, piso 4).
 * `kit` items come in every locker, `qty` of each; the rest are requested one by one in the form.
 * `order` sets the display order (getCollection doesn't keep file order); the kit is numbered by it.
 */
const equipment = defineCollection({
  loader: file('src/content/equipment-loan/equipment.json'),
  schema: z.discriminatedUnion('kit', [
    z.object({ kit: z.literal(true), order: z.number().int(), name: z.string(), qty: z.number().int().positive() }),
    z.object({ kit: z.literal(false), order: z.number().int(), name: z.string() }),
  ]),
});

export const collections = { groups, courses, studyPlan, equipment };
