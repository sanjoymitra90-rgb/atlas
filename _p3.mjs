import { validateUKNumber, normalizePhoneNumber, bucketLabels } from './src/auditor/validate.js';
const claimed = [
  ['',                  'malformed',      'empty'],
  ['+12125551234',      'non-uk',         'non-uk'],
  ['07305409280',       'malformed',      'not-plus-44'],
  ['+44123',            'malformed',      'wrong-length'],
  ['+4407305409280',    'malformed',      'bad-prefix'],
  ['+447777777777',     'suspected-test', 'identical-digits'],
  ['+447123456789',     'suspected-test', 'sequential-run'],
  ['+447305409280',     'valid',          'valid'],
];
let fail = 0;
for (const [inp, ec, eb] of claimed) {
  const r = validateUKNumber(normalizePhoneNumber(inp));
  const ok = r.category === ec && r.bucket === eb;
  if (!ok) fail++;
  console.log((ok?'OK  ':'FAIL') + '  ' + JSON.stringify(inp).padEnd(18) + ' -> ' + String(r.category).padEnd(15) + String(r.bucket).padEnd(18) + (ok?'':`  EXPECTED ${ec}/${eb}`));
}
console.log(fail === 0 ? '\nAll 8 rows verified.' : `\n${fail} MISMATCH`);
console.log('\nEvery bucket has a label?');
const buckets = ['empty','non-uk','not-plus-44','wrong-length','bad-prefix','identical-digits','sequential-run','valid'];
for (const b of buckets) console.log('  ' + b.padEnd(18) + (bucketLabels[b] ?? (b==='valid'?'(n/a — not a fault)':'*** MISSING ***')));
console.log('\nCountry-code spot check (prefix-free):');
for (const n of ['+12125551234','+15551234567','+33123456789','+441234','+7495123456','+861012345678','+9715012345','+35311234567']) {
  const r = validateUKNumber(n);
  console.log('  ' + n.padEnd(16) + (r.countryCode ?? '(uk path)'));
}
