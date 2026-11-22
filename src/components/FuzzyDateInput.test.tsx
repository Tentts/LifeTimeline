import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import i18n from '../i18n';
import { firstDayOfWeek, monthCells } from './calendar';
import { emptyDateFields, type FuzzyDateFields } from './fuzzyDateFields';
import { FuzzyDateInput } from './FuzzyDateInput';

let latest: FuzzyDateFields;

function Harness({ initial = emptyDateFields }: { initial?: FuzzyDateFields }) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    latest = value;
  }, [value]);
  return <FuzzyDateInput legend="When" value={value} onChange={setValue} />;
}

const openCalendar = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /^When:/ }));
  return screen.getByRole('group', { name: 'Calendar' });
};

describe('calendar date picker', () => {
  beforeEach(async () => {
    vi.useFakeTimers({ now: new Date(2026, 10, 22, 12), toFake: ['Date'] });
    await i18n.changeLanguage('en');
  });
  afterEach(() => vi.useRealTimers());

  it('opens on the current month with today marked', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const calendar = await openCalendar(user);
    expect(within(calendar).getByLabelText('Month')).toHaveValue('11');
    expect(within(calendar).getByLabelText('Year')).toHaveValue(2026);
    expect(within(calendar).getByRole('button', { name: 'November 22, 2026' })).toHaveAttribute(
      'aria-current',
      'date',
    );
  });

  it('picks a day and closes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const calendar = await openCalendar(user);
    await user.click(within(calendar).getByRole('button', { name: 'November 5, 2026' }));
    expect(latest).toMatchObject({ year: '2026', month: '11', day: '5' });
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^When:/ })).toHaveTextContent('Nov 5, 2026');
  });

  it('browses to another year without changing the date until a day is picked', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ year: '2020', month: '3', day: '9', approx: false }} />);
    const calendar = await openCalendar(user);
    const year = within(calendar).getByLabelText('Year');
    await user.clear(year);
    await user.type(year, '1998');
    expect(latest.year).toBe('2020');
    await user.click(within(calendar).getByRole('button', { name: 'March 14, 1998' }));
    expect(latest).toMatchObject({ year: '1998', month: '3', day: '14' });
  });

  it('wraps months across years', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ year: '2020', month: '12', day: '1', approx: false }} />);
    const calendar = await openCalendar(user);
    await user.click(within(calendar).getByRole('button', { name: 'Next month' }));
    expect(within(calendar).getByLabelText('Month')).toHaveValue('1');
    expect(within(calendar).getByLabelText('Year')).toHaveValue(2021);
  });

  it('can record only a month or only a year', async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ year: '2020', month: '3', day: '9', approx: false }} />);
    const calendar = await openCalendar(user);
    await user.click(within(calendar).getByLabelText('Month only'));
    expect(latest).toMatchObject({ year: '2020', month: '3', day: '' });
    await user.click(within(calendar).getByLabelText('Year only'));
    expect(latest).toMatchObject({ year: '2020', month: '', day: '' });
  });

  it('closes with Escape without bubbling to the surrounding dialog', async () => {
    const user = userEvent.setup();
    const onOuterKey = vi.fn();
    render(
      <div onKeyDown={onOuterKey}>
        <Harness />
      </div>,
    );
    await openCalendar(user);
    within(screen.getByRole('group', { name: 'Calendar' }))
      .getByLabelText('Year')
      .focus();
    onOuterKey.mockClear();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Calendar' })).not.toBeInTheDocument();
    expect(onOuterKey).not.toHaveBeenCalled();
  });

  it('aligns days under the right weekday', () => {
    // November 2026 starts on a Sunday.
    expect(monthCells(2026, 11, 0)[0]).toBe(1);
    expect(monthCells(2026, 11, 1).slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(monthCells(2024, 2, 0).filter(Boolean)).toHaveLength(29);
    expect(firstDayOfWeek('es')).toBe(1);
  });
});
