import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Strip the TS so we can import the real source without a build step.
const src = readFileSync(new URL('./utils.ts', import.meta.url), 'utf8')
const fn = src.slice(src.indexOf('export function callingName'))
const mod = await import('data:text/javascript,' + encodeURIComponent(
  fn.replace(/: string \| null \| undefined/g, '').replace(/\bp\b(?=\s*=>)/g, 'p')
))

const { callingName } = mod
assert.equal(callingName('K. Sarala Devi'), 'Sarala', 'leading initial is skipped')
assert.equal(callingName('B. Venkata Rao'), 'Venkata')
assert.equal(callingName('Dilip Neteti'), 'Dilip', 'plain first name survives')
assert.equal(callingName('P. Lakshmi Priya'), 'Lakshmi')
assert.equal(callingName('B V Harshitha'), 'Harshitha', 'spaced initials too')
assert.equal(callingName('Ravi'), 'Ravi', 'single word')
assert.equal(callingName('K.'), 'K.', 'all-initials falls back rather than empty')
assert.equal(callingName(''), '')
assert.equal(callingName(null), '')
console.log('callingName: 9 assertions passed')
