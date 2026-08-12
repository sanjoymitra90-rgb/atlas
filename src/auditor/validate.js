export function normalizePhoneNumber(value) {
  if (!value) return value;
  if (/[Ee]\+/.test(value)) {
    const m = /^\+?(\d+)(?:\.(\d+))?[Ee]\+(\d+)$/.exec(String(value).trim());
    if (m) {
      // Reject if no decimal point — cannot determine significant digits
      if (!m[2]) return value;
      const mantissaDigits = m[1].length + m[2].length;
      const totalDigits = parseInt(m[3], 10) + 1;
      if (mantissaDigits < totalDigits) return value; // precision lost — fail closed
    }
    const num = Number(value);
    if (!isNaN(num)) {
      const full = num.toString();
      return full.startsWith("+") ? full : "+" + full;
    }
  }
  const stripped = value.replace(/[\s\-\(\)]/g, "");
  if (/^44\d{9,10}$/.test(stripped)) return "+" + stripped;
  return value;
}

export function validateUKNumber(number) {
  if (!number) return { valid: false, category: 'malformed', reason: "Empty number" };
  const cleaned = number.replace(/[\s\-\(\)]/g, "");
  // Detect non-UK country codes — valid number, wrong country
  if (/^\+[1-9]\d+/.test(cleaned) && !cleaned.startsWith("+44")) {
    return { valid: false, category: 'non-uk', reason: "Non-UK destination" };
  }
  if (!cleaned.startsWith("+44")) return { valid: false, category: 'malformed', reason: "Does not start with +44" };
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 11 || digits.length > 13) return { valid: false, category: 'malformed', reason: "Invalid length" };
  const validStarts = ["1", "2", "3", "7", "8"];
  const afterCode = digits.slice(2);
  if (!validStarts.includes(afterCode[0])) return { valid: false, category: 'malformed', reason: "Invalid UK number prefix" };
  const uniqueDigits = new Set(afterCode);
  if (uniqueDigits.size === 1) return { valid: false, category: 'suspected-test', reason: "All digits identical" };
  let maxRun = 1, run = 1;
  for (let i = 1; i < afterCode.length; i++) {
    if (parseInt(afterCode[i]) === parseInt(afterCode[i - 1]) + 1) { run++; if (run > maxRun) maxRun = run; }
    else { run = 1; }
  }
  if (maxRun >= 5) return { valid: false, category: 'suspected-test', reason: "Sequential digits detected" };
  return { valid: true, category: 'valid', reason: "Valid" };
}

export function gapReasonBucket(reason) {
  if (!reason || reason === 'Valid') return 'other';
  const r = reason.toLowerCase();
  if (r === 'empty number') return 'empty';
  if (r.includes('non-uk')) return 'non-uk';
  if (r.includes('start with +44') || r.includes('+44')) return 'malformed';
  if (r.includes('length')) return 'malformed';
  if (r.includes('identical')) return 'suspected-test';
  if (r.includes('sequential')) return 'suspected-test';
  if (r.includes('prefix')) return 'malformed';
  if (r.includes('truncated')) return 'truncated';
  return 'other';
}
