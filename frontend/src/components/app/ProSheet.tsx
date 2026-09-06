'use client';

import Link from 'next/link';
import { PRO_SUBSCRIPTION_PRICE_LABEL } from '@/lib/subscription-arl';

export default function ProSheet({
  onClose,
  line = 'Context chips, Not tonight, and Pick again — plus an unlimited list.',
}: {
  onClose: () => void;
  line?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="pro-sheet-title"
        className="relative w-full max-w-md mx-auto rounded-t-2xl sm:rounded-2xl bg-elevated border border-line p-5 pb-8 shadow-xl"
      >
        <p id="pro-sheet-title" className="text-sm text-ink">
          <span className="font-semibold text-accent">Pro</span>
          {' · '}
          {line} {PRO_SUBSCRIPTION_PRICE_LABEL}.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/account"
            className="flex-1 text-center rounded-xl bg-accent text-accent-ink font-semibold py-2.5"
            onClick={onClose}
          >
            Upgrade
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-line text-ink py-2.5"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
