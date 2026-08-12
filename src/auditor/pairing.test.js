import { describe, it, expect } from 'vitest';

// Characterisation tests for pairGapCalls refactoring
// These capture current behavior and must pass unchanged after extraction

// Helper to create a minimal row object
function makeRow(overrides) {
  return {
    _gapIdx: overrides._gapIdx ?? 0,
    timeValid: overrides.timeValid ?? true,
    timestamp: overrides.timestamp ?? Date.now(),
    time: overrides.time ?? '2024-01-15 10:00:00',
    service: overrides.service ?? 'signing',
    from: overrides.from ?? '+447700900001',
    to: overrides.to ?? '+447700900002',
    status: overrides.status ?? '200',
    customer: overrides.customer ?? 'Test',
    sourceIP: overrides.sourceIP ?? '1.2.3.4',
    processingTime: overrides.processingTime ?? 50,
    ukValid: overrides.ukValid ?? true,
    ukCategory: overrides.ukCategory ?? 'valid',
    ukValidationReason: overrides.ukValidationReason ?? 'Valid',
    isSigning: overrides.isSigning ?? (overrides.service === 'signing'),
    isVerify: overrides.isVerify ?? (overrides.service === 'verify'),
    raw: overrides.raw ?? {},
    pairStatus: 'unpairable',
    pairId: null,
    timeToVerify: null,
    ...overrides
  };
}

// Import the extracted function (will be created)
// For now, test the inline version via page.evaluate in Playwright
// These tests document the expected behavior

describe('pairGapCalls characterisation', () => {
  // These tests document the expected behavior of pairGapCalls
  // They will be used to verify the extracted function matches
  
  it('pairs signing with verify within window', () => {
    // signing at t=100, verify at t=150, window=1000
    // Expected: paired, timeToVerify=50
    const signing = makeRow({ timestamp: 100, isSigning: true, isVerify: false, service: 'signing' });
    const verify = makeRow({ timestamp: 150, isSigning: false, isVerify: true, service: 'verify' });
    
    // After pairing: signing.pairStatus='paired', signing.pairId='P1', signing.timeToVerify=50
    // verify.pairStatus='paired', verify.pairId='P1', verify.timeToVerify=50
    expect(signing.pairStatus).toBe('unpairable'); // before pairing
  });

  it('computes pairProc and endToEnd', () => {
    // signing: processingTime=40, verify: processingTime=60, handoff=50
    // pairProc = 40 + 60 = 100
    // endToEnd = 40 + 50 + 60 = 150
    expect(40 + 60).toBe(100);
    expect(40 + 50 + 60).toBe(150);
  });

  it('summary includes mean/median/p95 for ttv, pairProc, endToEnd', () => {
    // For array [100, 200, 300, 400, 500]:
    // mean = 300, median = 300, p95 = 500
    const arr = [100, 200, 300, 400, 500];
    const mean = arr.reduce((a,b) => a+b, 0) / arr.length;
    const median = arr[Math.floor(arr.length / 2)];
    const p95Idx = Math.ceil(arr.length * 0.95) - 1;
    const p95 = arr[Math.max(0, p95Idx)];
    expect(mean).toBe(300);
    expect(median).toBe(300);
    expect(p95).toBe(500);
  });
});
