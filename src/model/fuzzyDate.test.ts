import {
  ageAt,
  compareFuzzyDates,
  formatFuzzyDate,
  isValidFuzzyDate,
  toDecimalYear,
} from './fuzzyDate';

describe('fuzzy dates', () => {
  it('places partial dates in the middle of their range', () => {
    expect(toDecimalYear({ year: 2000 })).toBe(2000.5);
    expect(toDecimalYear({ year: 2000, month: 1 })).toBeCloseTo(2000 + 1 / 24);
    expect(toDecimalYear({ year: 2000, month: 12, day: 31 })).toBeLessThan(2001);
  });

  it('orders dates chronologically', () => {
    const dates = [{ year: 2001 }, { year: 2000, month: 3 }, { year: 2000, month: 2, day: 9 }];
    expect([...dates].sort(compareFuzzyDates)).toEqual([dates[2], dates[1], dates[0]]);
  });

  it('computes age, respecting the birthday when known', () => {
    const birth = { year: 1990, month: 6, day: 15 };
    expect(ageAt(birth, { year: 2000, month: 6, day: 14 })).toBe(9);
    expect(ageAt(birth, { year: 2000, month: 6, day: 15 })).toBe(10);
    expect(ageAt(birth, { year: 2000 })).toBe(10);
    expect(ageAt(birth, { year: 1980 })).toBe(0);
  });

  it('formats by available precision', () => {
    expect(formatFuzzyDate({ year: 2008 }, 'en')).toBe('2008');
    expect(formatFuzzyDate({ year: 2008, month: 3 }, 'en')).toBe('March 2008');
    expect(formatFuzzyDate({ year: 2008, month: 3 }, 'es')).toMatch(/marzo/);
  });

  it('rejects impossible days and days without months', () => {
    expect(isValidFuzzyDate({ year: 2001, month: 2, day: 29 })).toBe(false);
    expect(isValidFuzzyDate({ year: 2000, month: 2, day: 29 })).toBe(true);
    expect(isValidFuzzyDate({ year: 2000, day: 3 })).toBe(false);
  });
});
