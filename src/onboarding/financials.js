/**
 * Pure financial arithmetic for the Onboarding Calculator.
 * Takes raw inputs, clamps them, and returns computed values.
 * No DOM access, no side effects.
 */
export function computeOnboardingFinancials({ totalHours, rate, marginPct, contingencyPct }) {
  // Coerce non-finite inputs to 0, then clamp
  let margin = Number.isFinite(marginPct) ? marginPct : 0;
  if (margin > 99) margin = 99;
  if (margin < 0) margin = 0;

  let contingency = Number.isFinite(contingencyPct) ? contingencyPct : 0;
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
