import { describe, it, expect } from 'vitest';
import { computeOnboardingFinancials } from './financials.js';

describe('computeOnboardingFinancials', () => {
  it('computes customer price correctly at 20% margin', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 20, contingencyPct: 0 });
    expect(result.internalCost).toBe(8000);
    expect(result.customerPrice).toBe(10000);
  });

  it('clamps margin to 99 when >= 100', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 100, contingencyPct: 0 });
    expect(result.margin).toBe(99);
  });

  it('clamps margin to 0 when negative', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: -50, contingencyPct: 0 });
    expect(result.margin).toBe(0);
  });

  it('clamps contingency to 0 when negative', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 20, contingencyPct: -10 });
    expect(result.contingency).toBe(0);
  });

  it('adds contingency hours', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 20, contingencyPct: 10 });
    expect(result.contingencyHours).toBe(10);
    expect(result.billableHours).toBe(110);
  });

  it('returns clamped values in result', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 150, contingencyPct: -5 });
    expect(result.margin).toBe(99);
    expect(result.contingency).toBe(0);
  });

  it('G5: coerces NaN margin to 0 instead of passing through', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 100, marginPct: NaN, contingencyPct: 0 });
    expect(result.margin).toBe(0);
    expect(result.customerPrice).toBe(10000);
  });

  it('G5: coerces NaN contingency to 0 instead of passing through', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 20, contingencyPct: NaN });
    expect(result.contingency).toBe(0);
  });

  it('G6: clamps margin 99.5 to 99', () => {
    const result = computeOnboardingFinancials({ totalHours: 100, rate: 80, marginPct: 99.5, contingencyPct: 0 });
    expect(result.margin).toBe(99);
  });
});
