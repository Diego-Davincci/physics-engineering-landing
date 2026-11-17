import type { CollectionEntry } from 'astro:content';
import { describe, expect, it } from 'vitest';
import { splitEquipment } from './equipment-loan';

/** Builds a fake collection entry. */
const entry = (id: string, data: CollectionEntry<'equipment'>['data']) => ({ id, data }) as CollectionEntry<'equipment'>;

describe('splitEquipment', () => {
  it('sorts by order, numbers the kit and keeps extras apart', () => {
    const { kit, extras } = splitEquipment([
      entry('cables', { kit: true, order: 3, name: 'Cables', qty: 3 }),
      entry('meter', { kit: false, order: 2, name: 'Multímetros' }),
      entry('scope', { kit: true, order: 1, name: 'Osciloscopio', qty: 1 }),
    ]);

    expect(kit).toEqual([
      { id: 'scope', number: 1, name: 'Osciloscopio', qty: 1 },
      { id: 'cables', number: 2, name: 'Cables', qty: 3 },
    ]);
    expect(extras).toEqual([{ id: 'meter', name: 'Multímetros' }]);
  });

  it('handles an empty collection', () => {
    expect(splitEquipment([])).toEqual({ kit: [], extras: [] });
  });
});
