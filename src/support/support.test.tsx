import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { createTimeline } from '../model/factory';
import { deleteAllData, saveTimeline } from '../storage/db';
import {
  CHECK_IN_COOLDOWN_MS,
  checkInsEnabled,
  LONG_SESSION_MS,
  setCheckInsEnabled,
  shouldCheckIn,
} from './checkIn';
import { CRISIS_LINES, FIND_A_HELPLINE_URL } from './resources';

const base = { openedAt: 0, lastCheckInAt: null, now: 1000 };

async function addEvent(user: ReturnType<typeof userEvent.setup>, title: string, valence: number) {
  await user.click(screen.getByRole('button', { name: '+ Add event' }));
  const dialog = screen.getByRole('dialog', { name: 'Add an event' });
  await user.type(within(dialog).getByLabelText(/What happened/), title);
  const slider = within(dialog).getByRole('slider');
  fireEvent.change(slider, { target: { value: String(valence) } });
  expect(slider).toHaveValue(String(valence));
  await user.click(within(dialog).getByRole('button', { name: 'Save' }));
}

async function openTimeline() {
  const user = userEvent.setup();
  await saveTimeline(createTimeline({ title: 'Supported', birthDate: { year: 1990 } }));
  render(<App />);
  await user.click(await screen.findByRole('button', { name: 'Supported' }));
  return user;
}

describe('check-in rules', () => {
  it('checks in when an event becomes very difficult', () => {
    expect(shouldCheckIn({ ...base, valence: -4 })).toBe(true);
    expect(shouldCheckIn({ ...base, previousValence: 1, valence: -5 })).toBe(true);
  });

  it('does not check in for milder events or unchanged difficult ones', () => {
    expect(shouldCheckIn({ ...base, valence: -3 })).toBe(false);
    expect(shouldCheckIn({ ...base, previousValence: -5, valence: -4 })).toBe(false);
  });

  it('respects the cooldown', () => {
    const now = CHECK_IN_COOLDOWN_MS;
    expect(shouldCheckIn({ ...base, valence: -5, lastCheckInAt: 1, now })).toBe(false);
    expect(shouldCheckIn({ ...base, valence: -5, lastCheckInAt: 0, now })).toBe(true);
  });

  it('checks in after a long session', () => {
    expect(shouldCheckIn({ ...base, valence: 3, now: LONG_SESSION_MS })).toBe(true);
    expect(shouldCheckIn({ ...base, valence: 3, now: LONG_SESSION_MS - 1 })).toBe(false);
  });
});

describe('crisis lines', () => {
  it('have valid phone and secure website links', () => {
    for (const line of [...CRISIS_LINES]) {
      expect(line.tel).toMatch(/^\d{3,}$/);
      expect(line.url).toMatch(/^https:\/\//);
    }
    expect(FIND_A_HELPLINE_URL).toMatch(/^https:\/\//);
  });
});

describe('support flow', () => {
  beforeEach(async () => {
    await deleteAllData();
    await i18n.changeLanguage('en');
  });

  it('opens from the footer and links out without sharing a referrer', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Need support?' }));
    const dialog = screen.getByRole('dialog', { name: 'Find support' });
    expect(within(dialog).getByRole('link', { name: 'Call 024' })).toHaveAttribute(
      'href',
      'tel:024',
    );
    for (const link of within(dialog).getAllByRole('link', { name: 'Website' })) {
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('checks in after a very difficult event and offers a break', async () => {
    const user = await openTimeline();
    await addEvent(user, 'A hard day', -4);
    const dialog = await screen.findByRole('dialog', { name: 'How are you doing?' });
    await user.click(within(dialog).getByRole('button', { name: 'Take a break' }));
    expect(screen.getByText('5 things you can see')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I’m ready to continue' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('stays quiet once check-ins are turned off', async () => {
    const user = await openTimeline();
    setCheckInsEnabled(false);
    expect(checkInsEnabled()).toBe(false);
    await addEvent(user, 'A hard day', -5);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
