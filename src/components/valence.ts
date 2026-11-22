/** Words for a -5…+5 rating, used in forms, lists and exports. */
export function valenceKey(
  valence: number,
): 'valence.veryHard' | 'valence.hard' | 'valence.neutral' | 'valence.good' | 'valence.veryGood' {
  if (valence <= -4) return 'valence.veryHard';
  if (valence < 0) return 'valence.hard';
  if (valence === 0) return 'valence.neutral';
  if (valence < 4) return 'valence.good';
  return 'valence.veryGood';
}

export const formatValence = (valence: number) => (valence > 0 ? `+${valence}` : String(valence));
