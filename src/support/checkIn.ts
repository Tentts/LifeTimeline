/** Gentle "how are you doing?" check-ins. They only appear right after saving an event. */
const OFF_KEY = 'lifetimeline.checkInsOff';
export const HARD_VALENCE = -4;
export const CHECK_IN_COOLDOWN_MS = 10 * 60 * 1000;
export const LONG_SESSION_MS = 30 * 60 * 1000;

export function checkInsEnabled(): boolean {
  try {
    return localStorage.getItem(OFF_KEY) !== 'true';
  } catch {
    return true;
  }
}

export function setCheckInsEnabled(enabled: boolean): void {
  try {
    if (enabled) localStorage.removeItem(OFF_KEY);
    else localStorage.setItem(OFF_KEY, 'true');
  } catch {
    // Storage unavailable: the preference lasts only until the next check.
  }
}

/**
 * Check in when an event newly becomes very difficult, or after a long stretch of work,
 * but never twice within the cooldown.
 */
export function shouldCheckIn(input: {
  previousValence?: number;
  valence: number;
  openedAt: number;
  lastCheckInAt: number | null;
  now: number;
}): boolean {
  const { previousValence, valence, openedAt, lastCheckInAt, now } = input;
  if (lastCheckInAt !== null && now - lastCheckInAt < CHECK_IN_COOLDOWN_MS) return false;
  const becameHard =
    valence <= HARD_VALENCE && (previousValence === undefined || previousValence > HARD_VALENCE);
  return becameHard || now - (lastCheckInAt ?? openedAt) >= LONG_SESSION_MS;
}
