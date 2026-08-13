/**
 * Pure timestamp parsing for gap data rows.
 * Takes a raw time string, returns parsed timestamp and validity flags.
 * No DOM access, no side effects.
 */
export function parseGapTimestamp(raw) {
  let timestamp = null;
  let timeValid = false;
  let timeHadOffset = false;
  if (raw) {
    const trimmed = raw.trim();
    if (/^\d{10}$/.test(trimmed)) {
      timestamp = parseInt(trimmed, 10) * 1000;
      timeValid = true;
      timeHadOffset = true; // epoch is unambiguous — no timezone assumption
    } else if (/^\d{13}$/.test(trimmed)) {
      timestamp = parseInt(trimmed, 10);
      timeValid = true;
      timeHadOffset = true; // epoch is unambiguous — no timezone assumption
    } else {
      const dd = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[\sT]?(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
      if (dd) {
        timestamp = Date.UTC(+dd[3], +dd[2] - 1, +dd[1], +dd[4] || 0, +dd[5] || 0, +dd[6] || 0);
        timeValid = true;
      } else {
        const hasOffset = /[Zz]|[+-]\d{2}:?\d{2}$/.test(trimmed);
        if (hasOffset) {
          // ISO with explicit offset — new Date() handles it correctly
          const d = new Date(trimmed);
          if (!isNaN(d.getTime())) { timestamp = d.getTime(); timeValid = true; timeHadOffset = true; }
        } else {
          // No offset — detect ISO-shaped strings and parse as UTC
          const iso = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
          if (iso) {
            timestamp = Date.UTC(+iso[1], +iso[2] - 1, +iso[3], +iso[4], +iso[5], +iso[6] || 0);
            timeValid = true;
            // timeHadOffset stays false — this is a genuine assumption (local time was intended but we treat as UTC)
          } else {
            // Non-ISO format — let new Date() handle it (may use local time)
            const d = new Date(trimmed);
            if (!isNaN(d.getTime())) { timestamp = d.getTime(); timeValid = true; }
          }
        }
      }
    }
  }
  return { timestamp, timeValid, timeHadOffset };
}
