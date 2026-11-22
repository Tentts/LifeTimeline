import { createTimeline } from '../model/factory';
import {
  deleteAllData,
  deleteTimeline,
  getTimeline,
  listTimelines,
  LOCAL_STORAGE_PREFIX,
  saveTimeline,
} from './db';

describe('local storage', () => {
  beforeEach(() => deleteAllData());

  it('saves, lists, loads and deletes timelines', async () => {
    const a = createTimeline({ title: 'A', birthDate: { year: 1990 }, now: new Date(2026, 0, 1) });
    const b = createTimeline({ title: 'B', birthDate: { year: 1985 }, now: new Date(2026, 5, 1) });
    await saveTimeline(a);
    await saveTimeline(b);

    expect((await listTimelines()).map((s) => s.title)).toEqual(['B', 'A']);
    expect(await getTimeline(a.id)).toEqual(a);

    await deleteTimeline(a.id);
    expect(await getTimeline(a.id)).toBeUndefined();
  });

  it('deletes everything, including app settings', async () => {
    await saveTimeline(createTimeline({ title: 'A', birthDate: { year: 1990 } }));
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}language`, 'es');
    localStorage.setItem('unrelated', 'keep');

    await deleteAllData();

    expect(await listTimelines()).toEqual([]);
    expect(localStorage.getItem(`${LOCAL_STORAGE_PREFIX}language`)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep');
  });
});
