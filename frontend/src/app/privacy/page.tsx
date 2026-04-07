import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CONTACT_EMAIL,
  PRODUCT_NAME,
  PRODUCT_URL,
} from '@/lib/legalConstants';

export const metadata: Metadata = {
  title: `Privacy Policy | ${PRODUCT_NAME}`,
  description: `How ${PRODUCT_NAME} collects, uses, and protects your information.`,
};

const LAST_UPDATED = 'April 6, 2026';

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 pb-16 px-4 text-slate-700">
      <p className="text-sm text-slate-500 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          ← Back to {PRODUCT_NAME}
        </Link>
      </p>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Introduction</h2>
          <p>
            {PRODUCT_NAME} (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates the website and
            service at{' '}
            <a
              href={PRODUCT_URL}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {PRODUCT_URL}
            </a>{' '}
            (the &quot;Service&quot;). This Privacy Policy describes how we collect, use, disclose, and
            safeguard information when you use the Service. By using the Service, you agree to this
            policy.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Information we collect</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-800">Account information.</strong> When you sign in with
              Google, we receive identifiers and profile information that Google provides (such as your
              Google account ID, email address, and name) as handled by our authentication provider.
            </li>
            <li>
              <strong className="text-slate-800">Watchlist and preferences.</strong> Content you add to
              the Service, including titles, status, notes, notification preferences, and related data you
              choose to store.
            </li>
            <li>
              <strong className="text-slate-800">Technical and usage data.</strong> Information such as
              IP address, browser type, device information, and general usage patterns collected through
              cookies, logs, and analytics tools.
            </li>
            <li>
              <strong className="text-slate-800">Communications.</strong> If you contact us, we retain
              the content of your message and your contact details as needed to respond.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">How we use information</h2>
          <p>We use the information above to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Provide, operate, and improve the Service;</li>
            <li>Authenticate users and maintain accounts;</li>
            <li>Send service-related and notification emails you have opted into;</li>
            <li>Understand usage and improve reliability and security;</li>
            <li>Comply with law and enforce our terms; and</li>
            <li>Generate personalized recommendations when you use features that rely on external AI
              services, using watchlist-related context as described below.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Third-party services</h2>
          <p>
            We rely on service providers that process data on our behalf or as independent controllers
            under their own policies. These include:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-slate-800">Google</strong> — Sign-in with Google (OAuth). See{' '}
              <a
                href="https://policies.google.com/privacy"
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google&apos;s Privacy Policy
              </a>
              .
            </li>
            <li>
              <strong className="text-slate-800">Supabase</strong> — Authentication, database, and
              related infrastructure for the Service.
            </li>
            <li>
              <strong className="text-slate-800">Resend</strong> — Delivery of transactional and
              notification email.
            </li>
            <li>
              <strong className="text-slate-800">Umami</strong> — Privacy-oriented analytics to
              understand aggregate usage of the Service.
            </li>
            <li>
              <strong className="text-slate-800">The Movie Database (TMDB)</strong> — Metadata and images
              for movies and TV titles when you search or add items. TMDB is a third-party data source;
              use of TMDB data is subject to{' '}
              <a
                href="https://www.themoviedb.org/terms-of-use"
                className="text-blue-600 hover:text-blue-700 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                TMDB&apos;s terms
              </a>
              .
            </li>
            <li>
              <strong className="text-slate-800">OpenAI</strong> — When you use recommendation features,
              relevant watchlist information may be sent to OpenAI to generate suggestions. OpenAI
              processes that data under its own policies and terms.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Cookies and similar technologies</h2>
          <p>
            We use cookies and similar technologies for session management, security, preferences, and
            analytics. You can control cookies through your browser settings; disabling some cookies may
            limit certain features.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Data retention</h2>
          <p>
            We retain information for as long as your account is active or as needed to provide the
            Service, comply with legal obligations, resolve disputes, and enforce our agreements. You may
            request deletion as described below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Security</h2>
          <p>
            We use reasonable administrative, technical, and organizational measures designed to protect
            information. No method of transmission or storage is completely secure.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Your rights and choices</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, or export
            personal information, or to object to or restrict certain processing. To exercise these
            rights or ask questions, contact us at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {CONTACT_EMAIL}
            </a>
            . You may also manage some preferences in-app (for example, notification settings).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Children</h2>
          <p>
            The Service is not directed to children under 13 (or the minimum age required in your
            jurisdiction). We do not knowingly collect personal information from children.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">International users</h2>
          <p>
            If you access the Service from outside the United States, your information may be
            transferred to and processed in the United States or other countries where we or our
            providers operate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Changes to this policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will post the updated policy on this
            page and revise the &quot;Last updated&quot; date. Material changes may be communicated
            through the Service or by email where appropriate.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions about this Privacy Policy:{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
