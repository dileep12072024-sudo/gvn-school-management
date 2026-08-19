// Run: node src/lib/grading.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const src = readFileSync(new URL('./grading.ts', import.meta.url), 'utf8')
  .replace(/: \{ min: number; grade: string; point: number \}\[\]/g, '')
  .replace(/: (number|string|boolean)(\[\])?/g, '')
  .replace(/results: \{ marks; max \}\[\]/g, 'results')
const { gradeFor, gradePoint, percentage, cgpa, isPass } = await import(
  'data:text/javascript,' + encodeURIComponent(src)
)

let failed = 0
const check = (label, actual, expected) => {
  try { assert.deepEqual(actual, expected) }
  catch { failed++; console.error(`FAIL  ${label}\n  expected: ${expected}\n  actual:   ${actual}`) }
}

// Band boundaries — the values most likely to be off by one.
check('91/100 → A1', gradeFor(91, 100), 'A1')
check('90/100 → A2', gradeFor(90, 100), 'A2')
check('81/100 → A2', gradeFor(81, 100), 'A2')
check('80/100 → B1', gradeFor(80, 100), 'B1')
check('33/100 → D',  gradeFor(33, 100), 'D')
check('32/100 → E',  gradeFor(32, 100), 'E')
check('0/100  → E',  gradeFor(0, 100),  'E')
check('100/100 → A1', gradeFor(100, 100), 'A1')

// Scales to a non-100 maximum.
check('45/50 (90%) → A2', gradeFor(45, 50), 'A2')
check('46/50 (92%) → A1', gradeFor(46, 50), 'A1')

// Degenerate inputs must not throw or return undefined.
check('max 0 → E',    gradeFor(10, 0), 'E')
check('NaN → E',      gradeFor(NaN, 100), 'E')
check('over max → A1', gradeFor(150, 100), 'A1')
check('negative → E',  gradeFor(-10, 100), 'E')
check('pct clamped',   percentage(150, 100), 100)

check('grade point A1', gradePoint(95, 100), 10)
check('grade point E',  gradePoint(10, 100), 0)

// CGPA
check('cgpa empty', cgpa([]), 0)
check('cgpa single', cgpa([{ marks: 95, max: 100 }]), 10)
check('cgpa mixed', cgpa([{ marks: 95, max: 100 }, { marks: 75, max: 100 }]), 9) // (10+8)/2
check('cgpa rounds to 1dp', cgpa([
  { marks: 95, max: 100 }, { marks: 75, max: 100 }, { marks: 55, max: 100 },
]), 8) // (10+8+6)/3

check('pass at threshold', isPass(35, 35), true)
check('fail below',        isPass(34, 35), false)

if (failed) { console.error(`\n${failed} failed`); process.exit(1) }
console.log('grading: all passed')
