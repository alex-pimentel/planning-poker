import { describe, it, expect } from 'vitest';
import { generateRoomCode, cardValueToNumber } from '../src/lib/utils';

describe('generateRoomCode', () => {
  it('generates a code of the specified length', () => {
    const code = generateRoomCode(6);
    expect(code).toHaveLength(6);
  });

  it('generates a code of default length 6', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('generates only valid characters', () => {
    const valid = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/;
    for (let i = 0; i < 20; i++) {
      expect(generateRoomCode()).toMatch(valid);
    }
  });

  it('generates different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 10 }, () => generateRoomCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('cardValueToNumber', () => {
  it('converts numeric strings to numbers', () => {
    expect(cardValueToNumber('0')).toBe(0);
    expect(cardValueToNumber('5')).toBe(5);
    expect(cardValueToNumber('13')).toBe(13);
    expect(cardValueToNumber('100')).toBe(100);
  });

  it('converts t-shirt sizes', () => {
    expect(cardValueToNumber('XS')).toBe(1);
    expect(cardValueToNumber('S')).toBe(2);
    expect(cardValueToNumber('M')).toBe(3);
    expect(cardValueToNumber('L')).toBe(5);
    expect(cardValueToNumber('XL')).toBe(8);
    expect(cardValueToNumber('XXL')).toBe(13);
  });

  it('returns null for unknown values', () => {
    expect(cardValueToNumber('?')).toBeNull();
  });
});
