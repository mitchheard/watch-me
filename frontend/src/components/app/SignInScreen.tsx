'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Wordmark } from '@/components/app/Wordmark';
import { AGE_ATTESTATION_LABEL } from '@/lib/age-attestation';

export default function SignInScreen() {
  const { loginWithGoogle } = useAuth();
  const [attested, setAttested] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink flex flex-col items-center justify-center px-6 py-12">
      <Wordmark size="lg" />
      <p className="mt-6 text-xl text-center text-ink/90">What do we watch tonight?</p>
      <p className="mt-2 text-sm text-muted text-center max-w-xs">
        A pick from your list — not another tracker.
      </p>

      <label className="mt-10 flex items-start gap-3 max-w-sm text-sm text-ink cursor-pointer">
        <input
          type="checkbox"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-line accent-accent"
        />
        <span>{AGE_ATTESTATION_LABEL}</span>
      </label>

      <button
        type="button"
        onClick={() => void loginWithGoogle()}
        disabled={!attested}
        className="mt-6 w-full max-w-sm rounded-xl bg-accent text-accent-ink font-semibold py-3 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue with Google
      </button>

      <p className="mt-8 text-xs text-muted text-center">
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
