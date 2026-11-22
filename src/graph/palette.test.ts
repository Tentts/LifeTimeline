import { mixHex } from './palette';

describe('mixHex', () => {
  it('interpolates between two colours', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#2f5fc4', '#c8417a', 2)).toBe('#c8417a');
  });
});
