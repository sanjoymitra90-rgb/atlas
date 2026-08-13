import { describe, it, expect } from 'vitest';
import { haversine } from './geo.js';

// Known great-circle distances (km) computed by independent means, used to
// verify the haversine implementation against physics rather than against itself.
// Values are approximate (real distance varies by a few km with model choice).
describe('haversine', () => {
  const cities = {
    london: [51.5074, -0.1278],
    paris: [48.8566, 2.3522],
    nyc: [40.7128, -74.006],
    sydney: [-33.8688, 151.2093],
    tokyo: [35.6762, 139.6503],
    sf: [37.7749, -122.4194]
  };
  const dist = (a, b) => haversine(...cities[a], ...cities[b]);

  it('computes London–Paris at ~344 km', () => {
    expect(dist('london', 'paris')).toBeCloseTo(343.6, 0);
  });

  it('computes London–New York at ~5570 km', () => {
    expect(dist('london', 'nyc')).toBeCloseTo(5570.2, 0);
  });

  it('computes London–Sydney at ~16994 km', () => {
    expect(dist('london', 'sydney')).toBeCloseTo(16993.9, 0);
  });

  it('computes Tokyo–Sydney at ~7826 km', () => {
    expect(dist('tokyo', 'sydney')).toBeCloseTo(7825.8, 0);
  });

  it('computes San Francisco–New York at ~4129 km', () => {
    expect(dist('sf', 'nyc')).toBeCloseTo(4129.1, 0);
  });

  it('is symmetric: distance(a, b) equals distance(b, a)', () => {
    expect(dist('london', 'paris')).toBeCloseTo(dist('paris', 'london'), 6);
    expect(dist('london', 'sydney')).toBeCloseTo(dist('sydney', 'london'), 6);
    expect(dist('tokyo', 'sf')).toBeCloseTo(dist('sf', 'tokyo'), 6);
  });

  it('returns 0 for a point against itself', () => {
    expect(haversine(51.5074, -0.1278, 51.5074, -0.1278)).toBe(0);
  });

  it('handles the antipodal-ish case without NaN', () => {
    // North Pole to South Pole is half the Earth's circumference (~20015 km).
    const d = haversine(90, 0, -90, 0);
    expect(Number.isFinite(d)).toBe(true);
    expect(d).toBeCloseTo(20015.1, 0);
  });
});