/**
 * Turns the equipment collection into what the locker and the receipt draw.
 * Pure (type imports only) so it can be unit-tested.
 */
import type { CollectionEntry } from 'astro:content';

/** Equipment that comes in every locker. */
export interface KitItem {
  id: string;
  /** 1-based number shared by the locker badge and the receipt line. */
  number: number;
  name: string;
  qty: number;
}

/** Equipment requested on its own in the form. */
export interface ExtraItem {
  id: string;
  name: string;
}

/**
 * Sorts the collection by `order` and splits it into the locker kit (numbered 1…n) and the extras.
 * @param entries - equipment collection entries, in any order
 * @returns the kit and the extras, each sorted by `order`
 */
export function splitEquipment(entries: CollectionEntry<'equipment'>[]): { kit: KitItem[]; extras: ExtraItem[] } {
  const kit: KitItem[] = [];
  const extras: ExtraItem[] = [];
  const sorted = [...entries].sort((a, b) => a.data.order - b.data.order);
  for (const { id, data } of sorted) {
    if (data.kit) kit.push({ id, number: kit.length + 1, name: data.name, qty: data.qty });
    else extras.push({ id, name: data.name });
  }
  return { kit, extras };
}
