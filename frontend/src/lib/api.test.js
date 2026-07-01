import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Token-lifecycle and decay-law tests for the data layer.
 * These encode the CLAUDE.md hard rules so CI fails if they regress:
 *   §2 4-hour decay, §4 5-minute one-time tokens with the four-case contract.
 */

const FIVE_MIN = 5 * 60 * 1000;
const FOUR_HOURS = 4 * 60 * 60 * 1000;

let api;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(1_750_000_000_000);
  vi.resetModules();               // fresh module state (tokens/counts) per test
  api = await import('./api.js');
});

describe('generateHandoffToken', () => {
  it('returns a 128-bit hex token (cryptographically random source)', async () => {
    const token = await api.generateHandoffToken('44101');
    expect(token).toMatch(/^[0-9a-f]{32}$/);
  });

  it('never returns the same token twice', async () => {
    const seen = new Set();
    for (let i = 0; i < 100; i++) seen.add(await api.generateHandoffToken('44101'));
    expect(seen.size).toBe(100);
  });

  it('encodes nothing but randomness — no ZIP or timestamp in the token', async () => {
    const token = await api.generateHandoffToken('44101');
    expect(token).not.toContain('44101');
    expect(token).not.toContain(String(Date.now()));
  });
});

describe('verifyHandoff — four-case contract', () => {
  it('Ok: returns the ZIP and increments its count', async () => {
    const token = await api.generateHandoffToken('44107');
    expect(await api.verifyHandoff(token)).toEqual({ status: 'Ok', zipCode: '44107' });
    expect(await api.getHandoffCountsByZip()).toEqual([{ zipCode: '44107', count: 1 }]);
  });

  it('AlreadyUsed: a token verifies exactly once', async () => {
    const token = await api.generateHandoffToken('44107');
    await api.verifyHandoff(token);
    expect(await api.verifyHandoff(token)).toEqual({ status: 'AlreadyUsed' });
    // count did not double-increment
    expect(await api.getHandoffCountsByZip()).toEqual([{ zipCode: '44107', count: 1 }]);
  });

  it('NotFound: unknown tokens are rejected', async () => {
    expect(await api.verifyHandoff('deadbeef'.repeat(4))).toEqual({ status: 'NotFound' });
  });

  it('Expired: rejected 1 ms past the 5-minute TTL, valid at exactly 5:00', async () => {
    const t1 = await api.generateHandoffToken('44101');
    vi.advanceTimersByTime(FIVE_MIN);            // exactly at TTL — still valid
    expect((await api.verifyHandoff(t1)).status).toBe('Ok');

    const t2 = await api.generateHandoffToken('44101');
    vi.advanceTimersByTime(FIVE_MIN + 1);        // 1 ms past — expired
    expect(await api.verifyHandoff(t2)).toEqual({ status: 'Expired' });
    // expired token is deleted, not reusable
    expect(await api.verifyHandoff(t2)).toEqual({ status: 'NotFound' });
  });
});

describe('4-hour Decay Law', () => {
  it('resolveStatus downgrades stale isLive=true to Unknown, never Live', () => {
    const now = Date.now();
    expect(api.resolveStatus({ isLive: true, lastVerified: now })).toBe('Live');
    expect(api.resolveStatus({ isLive: false, lastVerified: now })).toBe('Offline');
    expect(api.resolveStatus({ isLive: true, lastVerified: now - FOUR_HOURS - 1 })).toBe('Unknown');
    expect(api.resolveStatus({ isLive: false, lastVerified: now - FOUR_HOURS - 1 })).toBe('Unknown');
  });

  it('isFresh matches the decay boundary', () => {
    const now = Date.now();
    expect(api.isFresh(now - FOUR_HOURS + 1)).toBe(true);
    expect(api.isFresh(now - FOUR_HOURS)).toBe(false);
  });
});

describe('NO-PHI guarantee (CLAUDE.md §1)', () => {
  it('handoff records contain only geography and token state — nothing else', async () => {
    // The entire persisted shape: token -> { zipCode, expiresAt, used }
    const token = await api.generateHandoffToken('44129');
    await api.verifyHandoff(token);
    const counts = await api.getHandoffCountsByZip();
    for (const row of counts) {
      expect(Object.keys(row).sort()).toEqual(['count', 'zipCode']);
    }
  });

  it('Brightside records are clinic-level only (no patient fields)', async () => {
    const locations = await api.getBrightsideLocations();
    expect(locations).toHaveLength(17);
    const allowed = ['id', 'name', 'address', 'phone', 'lat', 'lng', 'services', 'acceptsMedicaid', 'zipCode', 'lastVerified'];
    for (const loc of locations) {
      for (const key of Object.keys(loc)) expect(allowed).toContain(key);
    }
  });
});
