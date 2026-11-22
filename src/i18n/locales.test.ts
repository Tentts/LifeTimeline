import { DEFAULT_LANGUAGE, resources, SUPPORTED_LANGUAGES } from './languages';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

const reference = flatten(resources[DEFAULT_LANGUAGE] as unknown as Tree);

describe('locales', () => {
  it('include English and Spanish, English first', () => {
    expect(SUPPORTED_LANGUAGES.map((l) => l.code)).toEqual(['en', 'es']);
  });

  describe.each(Object.keys(resources).filter((c) => c !== DEFAULT_LANGUAGE))('%s', (code) => {
    const translated = flatten(resources[code] as unknown as Tree);

    it('has every key from en.json', () => {
      const missing = Object.keys(reference).filter((k) => !(k in translated));
      expect(missing).toEqual([]);
    });

    it('has no keys that en.json does not have', () => {
      const extra = Object.keys(translated).filter((k) => !(k in reference));
      expect(extra).toEqual([]);
    });

    it('has no empty strings', () => {
      const empty = Object.entries(translated).filter(([, v]) => v.trim() === '');
      expect(empty).toEqual([]);
    });

    it('keeps the same {{placeholders}} as en.json', () => {
      const placeholders = (s: string) => (s.match(/{{\s*\w+\s*}}/g) ?? []).sort();
      const mismatched = Object.keys(reference).filter(
        (k) =>
          k in translated &&
          placeholders(reference[k]).join() !== placeholders(translated[k]).join(),
      );
      expect(mismatched).toEqual([]);
    });
  });
});
