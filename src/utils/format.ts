/**
 * Format a price in INR (stored as integer paisa-like units).
 * @param amount - Price in raw units (e.g. 50000000 = 5 Cr)
 * @param options.prefix - Whether to include ₹ symbol (default: true)
 */
export function formatPrice(amount: number, options?: { prefix?: boolean }): string {
  const prefix = options?.prefix === false ? '' : '₹';
  if (amount >= 10_000_000) {
    return `${prefix}${(amount / 10_000_000).toFixed(2)} Cr`;
  }
  return `${prefix}${((amount || 0) / 100_000).toFixed(0)} L`;
}

/**
 * Get a human-readable player type/role label.
 * @param role - Player role string (e.g. 'bowler', 'batsman')
 * @param bowlingType - Optional bowling subtype (e.g. 'pace', 'off_spin')
 * @param options.short - Use abbreviated labels (default: false)
 */
export function getPlayerType(role: string, bowlingType?: string, options?: { short?: boolean }): string {
  const short = options?.short ?? false;

  if (role === 'bowler' && bowlingType) {
    const typeMap: Record<string, string> = short
      ? { pace: 'Fast', medium: 'Medium', off_spin: 'Off Spin', leg_spin: 'Leg Spin', left_arm_spin: 'LA Spin' }
      : { pace: 'Fast Bowler', medium: 'Medium Pacer', off_spin: 'Off Spinner', leg_spin: 'Leg Spinner', left_arm_spin: 'Left-Arm Spinner' };
    return typeMap[bowlingType] || 'Bowler';
  }

  const roleMap: Record<string, string> = short
    ? { batsman: 'Batsman', bowler: 'Bowler', all_rounder: 'All-Rounder', wicket_keeper: 'WK-Bat' }
    : { batsman: 'Batsman', bowler: 'Bowler', all_rounder: 'All-Rounder', wicket_keeper: 'Wicket-Keeper' };
  return roleMap[role] || role.replace('_', ' ');
}
