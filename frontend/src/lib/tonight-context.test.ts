import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TONIGHT_CONTEXT,
  formatTonightContextLine,
  parseTonightContext,
  tonightContextEquals,
  tonightContextPromptBlock,
  whoIncludesKids,
} from './tonight-context';

describe('parseTonightContext', () => {
  it('accepts a full valid context', () => {
    expect(parseTonightContext({ time: '45m', who: 'kids', energy: 'low' })).toEqual({
      time: '45m',
      who: 'kids',
      energy: 'low',
    });
  });

  it('rejects missing or unknown chip ids', () => {
    expect(parseTonightContext(null)).toBeNull();
    expect(parseTonightContext({ time: '2h', who: 'solo' })).toBeNull();
    expect(parseTonightContext({ time: '8h', who: 'solo', energy: 'medium' })).toBeNull();
  });
});

describe('tonightContextEquals / whoIncludesKids', () => {
  it('compares chip ids', () => {
    expect(tonightContextEquals(DEFAULT_TONIGHT_CONTEXT, { ...DEFAULT_TONIGHT_CONTEXT })).toBe(true);
    expect(
      tonightContextEquals(DEFAULT_TONIGHT_CONTEXT, { ...DEFAULT_TONIGHT_CONTEXT, who: 'kids' })
    ).toBe(false);
  });

  it('flags the kids chip', () => {
    expect(whoIncludesKids('kids')).toBe(true);
    expect(whoIncludesKids('solo')).toBe(false);
  });
});

describe('copy', () => {
  it('formats the free-user static line', () => {
    expect(formatTonightContextLine(DEFAULT_TONIGHT_CONTEXT)).toBe(
      'Tonight · about 2 hours · just you'
    );
  });

  it('tells the model to demote R / TV-MA when kids are watching', () => {
    const block = tonightContextPromptBlock({ time: '2h', who: 'kids', energy: 'low' });
    expect(block).toMatch(/Kids are watching/);
    expect(block).toMatch(/Demote R-rated/);
    expect(block).toMatch(/TV-MA/);
  });

  it('omits the kids rule otherwise', () => {
    expect(tonightContextPromptBlock(DEFAULT_TONIGHT_CONTEXT)).not.toMatch(/Kids are watching/);
  });
});
