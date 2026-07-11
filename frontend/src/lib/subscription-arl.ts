/** Exact disclosure shown above the Pro checkout button (California ARL). */
export const PRO_SUBSCRIPTION_DISCLOSURE =
  '$25/year, automatically renews annually until canceled. Cancel anytime in Settings.';

export const PRO_SUBSCRIPTION_CONSENT_LABEL =
  'I agree to the auto-renewing subscription terms above.';

export const PRO_SUBSCRIPTION_PRICE_LABEL = '$25/year';

export function isValidSubscriptionConsent(body: unknown): body is {
  consented: true;
  termsText: string;
} {
  if (!body || typeof body !== 'object') return false;
  const { consented, termsText } = body as Record<string, unknown>;
  return consented === true && termsText === PRO_SUBSCRIPTION_DISCLOSURE;
}
