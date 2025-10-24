// Simple Node test harness for the password generator logic (shuffle + secure randomness)
// Run with: node generator_test.js

const crypto = require('crypto');
const assert = require('assert');

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:\",.<>?/~`';

function secureRandomInt(max) {
  if (max <= 0) return 0;
  // generate a random 32-bit unsigned int
  const buf = crypto.randomBytes(4);
  const val = buf.readUInt32LE(0);
  return val % max;
}

function pickRandomChar(set) {
  const idx = secureRandomInt(set.length);
  return set.charAt(idx);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    const tmp = array[i];
    array[i] = array[j];
    array[j] = tmp;
  }
}

function generatePasswordFromCounts({ symbols=0, numbers=0, uppercase=0, lowercase=0 }) {
  const chars = [];
  for (let i = 0; i < symbols; i++) chars.push(pickRandomChar(SYMBOLS));
  for (let i = 0; i < numbers; i++) chars.push(pickRandomChar(DIGITS));
  for (let i = 0; i < uppercase; i++) chars.push(pickRandomChar(UPPER));
  for (let i = 0; i < lowercase; i++) chars.push(pickRandomChar(LOWER));
  shuffleArray(chars);
  return chars.join('');
}

// Tests
function countMatches(str, charset) {
  let count = 0;
  for (const ch of str) if (charset.indexOf(ch) !== -1) count++;
  return count;
}

console.log('Running generator tests...');

// Test 1: 4,4,4,4 => length 16 and at least the requested counts
(() => {
  const counts = { symbols:4, numbers:4, uppercase:4, lowercase:4 };
  const pwd = generatePasswordFromCounts(counts);
  console.log('pwd:', pwd);
  assert.strictEqual(pwd.length, 16);
  assert.ok(countMatches(pwd, SYMBOLS) >= 4, 'symbols count');
  assert.ok(countMatches(pwd, DIGITS) >= 4, 'numbers count');
  assert.ok(countMatches(pwd, UPPER) >= 4, 'uppercase count');
  assert.ok(countMatches(pwd, LOWER) >= 4, 'lowercase count');
  console.log('Test 1 passed');
})();

// Test 2: edge case 0,0,4,4 => length 8 and counts for letters
(() => {
  const counts = { symbols:0, numbers:0, uppercase:4, lowercase:4 };
  const pwd = generatePasswordFromCounts(counts);
  assert.strictEqual(pwd.length, 8);
  assert.ok(countMatches(pwd, UPPER) >= 4);
  assert.ok(countMatches(pwd, LOWER) >= 4);
  console.log('Test 2 passed');
})();

// Test 3: random many times
(() => {
  for (let i=0;i<20;i++) {
    const s = secureRandomInt(11);
    const n = secureRandomInt(11);
    const u = secureRandomInt(11);
    const l = secureRandomInt(11);
    const total = s+n+u+l;
    // if total 0 skip
    if (total === 0) continue;
    const pwd = generatePasswordFromCounts({symbols:s,numbers:n,uppercase:u,lowercase:l});
    assert.strictEqual(pwd.length, total);
  }
  console.log('Test 3 passed (random generation)');
})();

console.log('All tests passed.');
