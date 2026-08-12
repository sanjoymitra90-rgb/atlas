// E.164 country calling codes — prefix-free: no valid code is a prefix of another.
// One-digit codes
const CC_ONE = new Set(['1', '7']);
// Two-digit codes (verified against ITU-T E.164)
const CC_TWO = new Set([
  '20','27','30','31','32','33','34','36','39',
  '40','41','43','44','45','46','47','48','49',
  '51','52','53','54','55','56','57','58',
  '60','61','62','63','64','65','66',
  '81','82','84','86',
  '90','91','92','93','94','95','98'
]);

function extractCountryCode(digitsAfterPlus) {
  const d1 = digitsAfterPlus.slice(0, 1);
  if (CC_ONE.has(d1)) return d1;
  const d2 = digitsAfterPlus.slice(0, 2);
  if (CC_TWO.has(d2)) return d2;
  return digitsAfterPlus.slice(0, 3);
}

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
  if (!number) return { valid: false, category: 'malformed', bucket: 'empty', reason: "Empty number" };
  const cleaned = number.replace(/[\s\-\(\)]/g, "");
  // Detect non-UK country codes — valid number, wrong country
  if (/^\+[1-9]\d+/.test(cleaned) && !cleaned.startsWith("+44")) {
    const digitsAfterPlus = cleaned.slice(1); // strip the '+'
    const countryCode = '+' + extractCountryCode(digitsAfterPlus);
    return { valid: false, category: 'non-uk', bucket: 'non-uk', reason: "Non-UK destination", countryCode };
  }
  if (!cleaned.startsWith("+44")) return { valid: false, category: 'malformed', bucket: 'not-plus-44', reason: "Does not start with +44" };
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length < 11 || digits.length > 13) return { valid: false, category: 'malformed', bucket: 'wrong-length', reason: "Invalid length" };
  const validStarts = ["1", "2", "3", "7", "8"];
  const afterCode = digits.slice(2);
  if (!validStarts.includes(afterCode[0])) return { valid: false, category: 'malformed', bucket: 'bad-prefix', reason: "Invalid UK number prefix" };
  const uniqueDigits = new Set(afterCode);
  if (uniqueDigits.size === 1) return { valid: false, category: 'suspected-test', bucket: 'identical-digits', reason: "All digits identical" };
  let maxRun = 1, run = 1;
  for (let i = 1; i < afterCode.length; i++) {
    if (parseInt(afterCode[i]) === parseInt(afterCode[i - 1]) + 1) { run++; if (run > maxRun) maxRun = run; }
    else { run = 1; }
  }
  if (maxRun >= 5) return { valid: false, category: 'suspected-test', bucket: 'sequential-run', reason: "Sequential digits detected" };
  return { valid: true, category: 'valid', bucket: 'valid', reason: "Valid" };
}

// Bucket labels — must sit next to the bucket definitions so they cannot drift apart.
// Bucket names are internal identifiers; labels are what the user sees.
export const bucketLabels = {
  'empty': 'Empty',
  'non-uk': 'Non-UK',
  'not-plus-44': 'Not +44',
  'wrong-length': 'Wrong length',
  'bad-prefix': 'Bad prefix',
  'identical-digits': 'Identical digits',
  'sequential-run': 'Sequential run',
  'other': 'Other'
};


