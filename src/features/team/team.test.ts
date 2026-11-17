import { describe, expect, it } from 'vitest';
import { initials, swing } from './team';

describe('initials', () => {
  it('uses the first given name and the first surname', () => {
    expect(initials('Jairo Humberto Marín Cadavid')).toBe('JM');
    expect(initials('Diego Alejandro Londoño Jiménez')).toBe('DL');
  });

  it('skips academic prefixes', () => {
    expect(initials('Prof. Nerio Montoya')).toBe('NM');
  });

  it('gives one letter for a single name, keeping accents', () => {
    expect(initials('Mónica')).toBe('M');
    expect(initials('Ángela Ruiz')).toBe('ÁR');
  });

  it('returns an empty string when there is no name', () => {
    expect(initials('  ')).toBe('');
  });
});

describe('swing', () => {
  it('pushes neighbors to opposite sides', () => {
    expect(Math.sign(swing(0).kick)).toBe(-Math.sign(swing(1).kick));
  });

  it('repeats the resting tilts after four cards', () => {
    expect(swing(4).rest).toBe(swing(0).rest);
  });
});
