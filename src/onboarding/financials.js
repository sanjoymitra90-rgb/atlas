/**
 * Pure financial arithmetic for the Onboarding Calculator.
 * Takes raw inputs, clamps them, and returns computed values.
 * No DOM access, no side effects.
 */
export function computeOnboardingFinancials({ totalHours, rate, marginPct, contingencyPct }) {
  // Clamp margin to 0-99
  let margin = marginPct;
  if (margin >= 100) margin = 99;
  if (margin < 0) margin = 0;

  // Clamp contingency to 0+
  let contingency = contingencyPct;
  if (contingency < 0) contingency = 0;

  const contingencyHours = Math.round(totalHours * (contingency / 100));
  const billableHours = totalHours + contingencyHours;
  const internalCost = billableHours * rate;
  const marginMultiplier = 1 - (margin / 100);
  const customerPrice = marginMultiplier > 0 ? internalCost / marginMultiplier : internalCost;

  return {
    margin,
    contingency,
    contingencyHours,
    billableHours,
    internalCost,
    customerPrice
  };
}
