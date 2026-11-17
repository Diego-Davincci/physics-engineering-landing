import { describe, expect, it } from 'vitest';
import { buildGraph, type CourseLinks } from './graph';

const course = (id: string, prerequisites: string[] = [], corequisites: string[] = []): CourseLinks => ({
  id,
  prerequisites,
  corequisites,
});

describe('buildGraph', () => {
  it('gives every course an entry, even without links', () => {
    const graph = buildGraph([course('a')]);
    expect(graph.get('a')).toEqual({ prerequisites: [], corequisites: [], unlocks: [] });
  });

  it('keeps prerequisites and derives what each course unlocks', () => {
    const graph = buildGraph([course('calc-1'), course('calc-2', ['calc-1']), course('ode', ['calc-2']), course('vector', ['calc-2'])]);
    expect(graph.get('calc-2')!.prerequisites).toEqual(['calc-1']);
    expect(graph.get('calc-1')!.unlocks).toEqual(['calc-2']);
    expect(graph.get('calc-2')!.unlocks).toEqual(['ode', 'vector']);
    expect(graph.get('ode')!.unlocks).toEqual([]);
  });

  it('makes corequisites symmetric, in input order', () => {
    const graph = buildGraph([course('lab'), course('theory', [], ['lab']), course('extra', [], ['lab'])]);
    expect(graph.get('theory')!.corequisites).toEqual(['lab']);
    expect(graph.get('lab')!.corequisites).toEqual(['theory', 'extra']);
  });

  it('does not duplicate links declared on both sides or twice', () => {
    const graph = buildGraph([course('a', [], ['b']), course('b', [], ['a']), course('c', ['a', 'a'])]);
    expect(graph.get('a')!.corequisites).toEqual(['b']);
    expect(graph.get('b')!.corequisites).toEqual(['a']);
    expect(graph.get('c')!.prerequisites).toEqual(['a']);
    expect(graph.get('a')!.unlocks).toEqual(['c']);
  });

  it('ignores links to courses outside the input when deriving the reverse side', () => {
    const graph = buildGraph([course('a', ['missing'], ['ghost'])]);
    expect(graph.get('a')).toEqual({ prerequisites: ['missing'], corequisites: ['ghost'], unlocks: [] });
    expect(graph.has('missing')).toBe(false);
  });
});
