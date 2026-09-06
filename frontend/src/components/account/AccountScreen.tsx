'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import SignInScreen from '@/components/app/SignInScreen';
import {
  PRO_SUBSCRIPTION_CONSENT_LABEL,
  PRO_SUBSCRIPTION_DISCLOSURE,
  PRO_SUBSCRIPTION_PRICE_LABEL,
} from '@/lib/subscription-arl';

const ADMIN_USER_ID = '464661fa-7ae1-406f-9975-dec0ccbc94aa';

type SubscriptionPayload = {
  subscriptionStatus: string;
  subscriptionPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPro: boolean;
  hasProAccess?: boolean;
};

type Prefs = {
  newSeasonAlerts: boolean;
};

export default function AccountScreen() {
  const { user, logout } = useAuth();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<SubscriptionPayload | null>(null);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [arlConsentChecked, setArlConsentChecked] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subRes, prefRes] = await Promise.all([
        fetch('/api/user/subscription', { credentials: 'include' }),
        fetch('/api/user/notifications/preferences', { credentials: 'include' }),
      ]);
      const subData = await subRes.json();
      setSub(subRes.ok ? (subData as SubscriptionPayload) : null);
      if (prefRes.ok) {
        const prefData = await prefRes.json();
        setPrefs(prefData.preferences ?? null);
      }
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success("You're now on Pro");
      void load();
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/account');
      }
    }
  }, [searchParams, load]);

  const startCheckout = async () => {
    if (!arlConsentChecked) return;
    setCheckoutBusy(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consented: true,
          termsText: PRO_SUBSCRIPTION_DISCLOSURE,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Checkout unavailable');
        return;
      }
      if (data.url && typeof data.url === 'string') {
        window.location.href = data.url;
        return;
      }
      toast.error('No checkout URL returned');
    } catch {
      toast.error('Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(typeof data.error === 'string' ? data.error : 'Portal unavailable');
        return;
      }
      if (data.url && typeof data.url === 'string') {
        window.location.href = data.url;
        return;
      }
      toast.error('No portal URL returned');
    } catch {
      toast.error('Could not open billing portal');
    } finally {
      setPortalBusy(false);
    }
  };

  const toggleSeasonAlerts = async () => {
    if (!prefs || !sub?.isPro) return;
    const next = !prefs.newSeasonAlerts;
    setPrefs({ ...prefs, newSeasonAlerts: next });
    await fetch('/api/user/notifications/preferences', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newSeasonAlerts: next }),
    });
  };

  if (!user) {
    return <SignInScreen />;
  }

  if (loading || !sub) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-center text-muted">Loading account…</div>;
  }

  const periodEndLabel = sub.subscriptionPeriodEnd
    ? new Date(sub.subscriptionPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;
  const isCanceling = sub.isPro && sub.cancelAtPeriodEnd;
  const isAdmin = user.id === ADMIN_USER_ID;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-28">
      <h1 className="text-2xl font-semibold text-ink">Account</h1>
      <p className="text-sm text-muted mt-1">{user.email}</p>

      {sub.isPro ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">You&apos;re on Pro</h2>
            {isCanceling && periodEndLabel ? (
              <p className="text-sm text-muted mt-1">
                Cancels on {periodEndLabel}. You&apos;ll keep Pro access until then.
              </p>
            ) : null}
            {!isCanceling && periodEndLabel ? (
              <p className="text-sm text-muted mt-1">Renews on {periodEndLabel}.</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => void openPortal()}
            disabled={portalBusy}
            className="w-full rounded-xl bg-accent text-accent-ink font-medium py-2.5 disabled:opacity-50"
          >
            {portalBusy ? 'Opening…' : isCanceling ? 'Resume subscription' : 'Manage subscription'}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Watch Me Pro</h2>
            <p className="text-2xl font-semibold text-accent mt-1">{PRO_SUBSCRIPTION_PRICE_LABEL}</p>
            <p className="text-sm text-muted mt-2">
              Context chips, Not tonight, Pick again, unlimited list, and new-season alerts.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-elevated p-4 text-sm text-ink" role="region" aria-label="Subscription terms">
            {PRO_SUBSCRIPTION_DISCLOSURE}
          </div>
          <label htmlFor="arl-consent" className="flex items-start gap-3 cursor-pointer text-sm text-ink">
            <input
              id="arl-consent"
              type="checkbox"
              checked={arlConsentChecked}
              onChange={(e) => setArlConsentChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
            />
            <span>{PRO_SUBSCRIPTION_CONSENT_LABEL}</span>
          </label>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={!arlConsentChecked || checkoutBusy}
            className="w-full rounded-xl bg-accent text-accent-ink font-semibold py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutBusy ? 'Redirecting…' : 'Upgrade to Pro'}
          </button>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-line bg-surface p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-ink">New-season alerts</p>
            <p className="text-sm text-muted mt-0.5">
              Email when something on your list — or something you finished — has a new season.
            </p>
          </div>
          {sub.isPro ? (
            <button
              type="button"
              role="switch"
              aria-checked={prefs?.newSeasonAlerts ?? true}
              onClick={() => void toggleSeasonAlerts()}
              className={`shrink-0 h-7 w-12 rounded-full ${
                prefs?.newSeasonAlerts ? 'bg-accent' : 'bg-line'
              }`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-accent-ink mt-1 transition ${
                  prefs?.newSeasonAlerts ? 'ml-6' : 'ml-1'
                }`}
              />
            </button>
          ) : (
            <span className="text-[10px] uppercase tracking-wide font-semibold text-accent">Pro</span>
          )}
        </div>
      </div>

      {isAdmin ? (
        <Link href="/admin" className="mt-6 block text-sm text-accent">
          Admin
        </Link>
      ) : null}

      <button
        type="button"
        onClick={() => void logout()}
        className="mt-8 text-sm text-muted"
      >
        Sign out
      </button>

      <p className="mt-10 text-xs text-muted">
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
        {' · '}
        <Link href="/terms" className="underline">
          Terms
        </Link>
      </p>
    </div>
  );
}
