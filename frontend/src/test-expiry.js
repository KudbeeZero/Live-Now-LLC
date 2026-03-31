/**
 * Proof of Presence — Token Expiry Test Utility
 *
 * Verifies the 5-minute TTL behavior that mirrors the Motoko canister's
 * TOKEN_EXPIRY_NS constant (300_000_000_000 ns = 300 seconds).
 *
 * Run with:  node src/test-expiry.js
 *
 * To test against a live canister (requires dfx running):
 *   dfx canister call live_now_backend generateHandoffToken '("44101")'
 *   # Copy the returned token, wait >5 minutes, then:
 *   dfx canister call live_now_backend verifyHandoff '("<token>")'
 *   # Expected: variant { Expired }
 */

const TOKEN_TTL_MS = 5 * 60 * 1000; // 300,000 ms — must match TOKEN_EXPIRY_NS / 1_000_000

// ── Token creation simulation ─────────────────────────────────────────────────

function createMockToken(zipCode) {
  const nonce = Math.floor(Math.random() * 900000) + 100000;
  return {
    token:     `${nonce}-${Date.now()}`,
    createdAt: Date.now(),
    zipCode,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
}

function isTokenExpired(tokenRecord) {
  return Date.now() > tokenRecord.expiresAt;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(description, condition) {
  if (condition) {
    console.log(`  PASS  ${description}`);
    passed++;
  } else {
    console.error(`  FAIL  ${description}`);
    failed++;
  }
}

console.log('\nProof of Presence — Token Expiry Tests\n');

// Test 1: Fresh token should not be expired
const fresh = createMockToken('44101');
assert('Fresh token is not expired immediately after creation', !isTokenExpired(fresh));

// Test 2: Token with past expiresAt should be expired
const stale = { ...createMockToken('44101'), expiresAt: Date.now() - 1 };
assert('Token with past expiresAt is expired', isTokenExpired(stale));

// Test 3: Token expires exactly at TTL boundary (not before)
const nearExpiry = { ...createMockToken('44101'), expiresAt: Date.now() + 1 };
assert('Token with 1ms remaining is not yet expired', !isTokenExpired(nearExpiry));

// Test 4: TTL constant matches Motoko canister value
const MOTOKO_TTL_NS  = 300_000_000_000;  // from main.mo TOKEN_EXPIRY_NS
const JS_TTL_NS      = TOKEN_TTL_MS * 1_000_000;
assert(
  `JS TTL (${JS_TTL_NS} ns) matches Motoko TOKEN_EXPIRY_NS (${MOTOKO_TTL_NS} ns)`,
  JS_TTL_NS === MOTOKO_TTL_NS
);

// Test 5: Token format matches expected nonce-timestamp pattern
const tokenPattern = /^\d{6}-\d{13}$/;
assert(
  'Token format matches nonce-timestamp pattern (6-digit nonce, 13-digit ms timestamp)',
  tokenPattern.test(fresh.token)
);

// Test 6: One-time use — token deleted on verify (simulated)
const tokenStore = new Map();
const tokenRecord = createMockToken('44101');
tokenStore.set(tokenRecord.token, tokenRecord);

function mockVerify(token) {
  const record = tokenStore.get(token);
  if (!record) return 'NotFound';
  if (isTokenExpired(record)) { tokenStore.delete(token); return 'Expired'; }
  tokenStore.delete(token);  // one-time use
  return `Ok(${record.zipCode})`;
}

const firstVerify  = mockVerify(tokenRecord.token);
const secondVerify = mockVerify(tokenRecord.token);
assert('First verify succeeds with Ok(zipCode)', firstVerify.startsWith('Ok('));
assert('Second verify returns NotFound (one-time use enforced)', secondVerify === 'NotFound');

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
