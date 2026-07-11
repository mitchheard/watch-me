import { describe, expect, it } from 'vitest';
import {
  isValidSubscriptionConsent,
  PRO_SUBSCRIPTION_DISCLOSURE,
} from './subscription-arl';

describe('isValidSubscriptionConsent', () => {
  it('accepts exact disclosure with consented true', () => {
    expect(
      isValidSubscriptionConsent({
        consented: true,
        termsText: PRO_SUBSCRIPTION_DISCLOSURE,
      })
    ).toBe(true);
  });

  it('rejects unchecked consent', () => {
    expect(
      isValidSubscriptionConsent({
        consented: false,
        termsText: PRO_SUBSCRIPTION_DISCLOSURE,
      })
    ).toBe(false);
  });

  it('rejects mismatched terms text', () => {
    expect(
      isValidSubscriptionConsent({
        consented: true,
        termsText: 'wrong terms',
      })
    ).toBe(false);
  });

  it('rejects missing body', () => {
    expect(isValidSubscriptionConsent(null)).toBe(false);
    expect(isValidSubscriptionConsent(undefined)).toBe(false);
  });
});
