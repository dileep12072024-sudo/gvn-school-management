// Run: node src/lib/money.test.mjs
// Deliberately dependency-free — node's own assert, no test framework.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Strip the TS types so we can import the real source rather than a copy.
const src = readFileSync(new URL('./money.ts', import.meta.url), 'utf8')
  .replace(/: (number|string)(\[\])?/g, '')
  .replace(/ as const/g, '')
const { rupeesInWords } = await import(
  'data:text/javascript,' + encodeURIComponent(src)
)

const cases = [
  [0,        'Zero'],
  [1,        'One'],
  [15,       'Fifteen'],
  [20,       'Twenty'],
  [21,       'Twenty One'],
  [100,      'One Hundred'],
  [101,      'One Hundred One'],
  [999,      'Nine Hundred Ninety Nine'],
  [1000,     'One Thousand'],
  [1234,     'One Thousand Two Hundred Thirty Four'],
  [12000,    'Twelve Thousand'],
  // Indian grouping — the whole reason this isn't a library call.
  [100000,   'One Lakh'],
  [150000,   'One Lakh Fifty Thousand'],
  [1234567,  'Twelve Lakh Thirty Four Thousand Five Hundred Sixty Seven'],
  [10000000, 'One Crore'],
  [12345678, 'One Crore Twenty Three Lakh Forty Five Thousand Six Hundred Seventy Eight'],
  // Paise are dropped, negatives and junk yield ''.
  [1500.75,  'One Thousand Five Hundred'],
  [-5,       ''],
  [NaN,      ''],
]

let failed = 0
for (const [input, expected] of cases) {
  const actual = rupeesInWords(input)
  try {
    assert.equal(actual, expected)
  } catch {
    failed++
    console.error(`FAIL  ${input}\n  expected: "${expected}"\n  actual:   "${actual}"`)
  }
}

if (failed) {
  console.error(`\n${failed}/${cases.length} failed`)
  process.exit(1)
}
console.log(`rupeesInWords: ${cases.length}/${cases.length} passed`)
