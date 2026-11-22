import { within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

export const dateTriggers = (scope: HTMLElement) => [
  ...scope.querySelectorAll<HTMLElement>('[data-date-trigger]'),
];

/** Records a year-only date through the calendar of the given date field. */
export async function enterYear(user: UserEvent, scope: HTMLElement, year: string, index = 0) {
  await user.click(dateTriggers(scope)[index]);
  const calendar = within(scope).getByRole('group', { name: 'Calendar' });
  await user.click(within(calendar).getByLabelText('Year only'));
  const input = within(calendar).getByLabelText('Year');
  await user.clear(input);
  await user.type(input, year);
  await user.click(within(calendar).getByRole('button', { name: 'Done' }));
}
