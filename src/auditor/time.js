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
    } else if (/^\d{13}$/.test(trimmed)) {
      timestamp = parseInt(trimmed, 10);
      timeValid = true;
    } else {
      const dd = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[\sT]?(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(trimmed);
      if (dd) {
        timestamp = Date.UTC(+dd[3], +dd[2] - 1, +dd[1], +dd[4] || 0, +dd[5] || 0, +dd[6] || 0);
        timeValid = true;
      } else {
        const hasOffset = /[Zz]|[+-]\d{2}:?\d{2}$/.test(trimmed);
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) { timestamp = d.getTime(); timeValid = true; timeHadOffset = hasOffset; }
      }
    }
  }
  return { timestamp, timeValid, timeHadOffset };
}
