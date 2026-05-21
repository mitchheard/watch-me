'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

type SubscriptionPayload = {
  subscriptionStatus: string;
  subscriptionPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  isPro: boolean;
};

export default function SettingsClient() {
  const { user, loginWithGoogle } = useAuth();
  const searchParams = useSearchParams();
  const [sub, setSub] = useState<SubscriptionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);

  const loadSubscription = useCallback(async () => {
    if (!user) {
      setSub(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/user/subscription', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setSub(null);
        return;
      }
      setSub(data as SubscriptionPayload);
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      toast.success("You're now on Pro 🎉");
      void loadSubscription();
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/settings');
      }
    }
  }, [searchParams, loadSubscription]);

  const startCheckout = async () => {
    setCheckoutBusy(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        credentials: 'include',
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

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Account &amp; Pro</h1>
        <p className="text-slate-600">Sign in to manage your Watch Me Pro subscription.</p>
        <button
          type="button"
          onClick={() => void loginWithGoogle()}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  if (loading || !sub) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center text-slate-600">Loading account…</div>
    );
  }

  const periodEndLabel = sub.subscriptionPeriodEnd
    ? new Date(sub.subscriptionPeriodEnd).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const isCanceling = sub.isPro && sub.cancelAtPeriodEnd;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Account &amp; Pro</h1>
      <p className="text-slate-600 text-sm sm:text-base mb-8">
        Signed in as <span className="font-medium text-slate-800">{user.email}</span>
      </p>

      {sub.isPro ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircleIcon className="h-8 w-8 text-emerald-600 shrink-0" aria-hidden />
            <div>
              <h2 className="text-lg font-semibold text-emerald-900">You&apos;re on Pro</h2>
              {isCanceling && periodEndLabel && (
                <p className="text-emerald-800 text-sm mt-1">
                  Cancels on {periodEndLabel}. You&apos;ll keep Pro access until then.
                </p>
              )}
              {!isCanceling && periodEndLabel && (
                <p className="text-emerald-800 text-sm mt-1">
                  Renews on {periodEndLabel} (annual billing).
                </p>
              )}
              {!periodEndLabel && (
                <p className="text-emerald-800 text-sm mt-1">
                  Your Pro subscription is active. Renewal date will appear here after the next Stripe
                  sync.
                </p>
              )}
            </div>
          </div>
          {isCanceling ? (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={portalBusy}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 disabled:opacity-50"
            >
              {portalBusy ? 'Opening…' : 'Resume subscription'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void openPortal()}
              disabled={portalBusy}
              className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 font-medium hover:bg-emerald-100 disabled:opacity-50"
            >
              {portalBusy ? 'Opening…' : 'Manage subscription'}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Upgrade to Pro</h2>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              $29/year
              <span className="block text-sm font-normal text-slate-600 mt-0.5">
                ~$0.56/week, billed annually
              </span>
            </p>
          </div>
          <ul className="text-sm text-slate-700 space-y-2 list-disc pl-5">
            <li>
              <strong>What Should I Watch?</strong> — personalized AI picks from your watchlist
            </li>
            <li>
              <strong>Unlimited watchlist</strong> — free tier is capped at 50 titles
            </li>
            <li>
              <span className="text-slate-500">Coming soon:</span> Discover — broader AI recommendations
              from TMDB
            </li>
            <li>
              <span className="text-slate-500">Coming soon:</span> New-seasons email alerts
            </li>
          </ul>
          <button
            type="button"
            onClick={() => void startCheckout()}
            disabled={checkoutBusy}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {checkoutBusy ? 'Redirecting…' : 'Upgrade to Pro'}
          </button>
          <p className="text-xs text-slate-500">
            Secure checkout with Stripe (test mode in development). By upgrading you agree to our
            billing provider&apos;s terms. See also{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Privacy
            </Link>
            .
          </p>
        </div>
      )}

      <div className="mt-10 text-sm text-slate-600">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to watchlist
        </Link>
      </div>
    </div>
  );
}
