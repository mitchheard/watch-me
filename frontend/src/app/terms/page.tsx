import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CONTACT_EMAIL,
  PRODUCT_NAME,
  PRODUCT_URL,
} from '@/lib/legalConstants';

export const metadata: Metadata = {
  title: `Terms of Service | ${PRODUCT_NAME}`,
  description: `Terms governing your use of ${PRODUCT_NAME}.`,
};

const LAST_UPDATED = 'April 6, 2026';

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 pb-16 px-4 text-slate-700">
      <p className="text-sm text-slate-500 mb-6">
        <Link href="/" className="text-blue-600 hover:text-blue-700">
          ← Back to {PRODUCT_NAME}
        </Link>
      </p>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-500 mb-8">Last updated: {LAST_UPDATED}</p>

      <div className="space-y-8 text-[15px] leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Agreement to terms</h2>
          <p>
            These Terms of Service (&quot;Terms&quot;) govern your access to and use of {PRODUCT_NAME},
            available at{' '}
            <a
              href={PRODUCT_URL}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {PRODUCT_URL}
            </a>{' '}
            (the &quot;Service&quot;), operated by AvidX LLC (&quot;Company,&quot; &quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;). By accessing or using the Service, you agree to these
            Terms. If you do not agree, do not use the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Eligibility</h2>
          <p>
            You must be able to form a binding contract in your jurisdiction and meet any minimum age
            requirements (including at least 13 years old in the United States) to use the Service. If you
            use the Service on behalf of an organization, you represent that you have authority to bind
            that organization.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Description of the Service</h2>
          <p>
            {PRODUCT_NAME} provides tools to track movies and TV shows, manage watchlists, receive
            optional notifications, and related features. We may modify, suspend, or discontinue any
            part of the Service at any time.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
          <p>
            You may need an account (for example, via Google sign-in) to use certain features. You are
            responsible for safeguarding your credentials and for activity under your account. Notify us
            at{' '}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-blue-600 hover:text-blue-700 underline"
            >
              {CONTACT_EMAIL}
            </a>{' '}
            if you believe your account has been compromised.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Violate any applicable law or regulation;</li>
            <li>Infringe intellectual property or other rights of others;</li>
            <li>Attempt to gain unauthorized access to the Service, other accounts, or our systems;</li>
            <li>Interfere with or disrupt the Service or servers or networks connected to the Service;</li>
            <li>Use the Service to distribute malware, spam, or deceptive content;</li>
            <li>Scrape, data-mine, or automate access to the Service in a way that burdens or harms the
              Service without our prior written consent; or</li>
            <li>Use the Service for any illegal, harmful, or fraudulent purpose.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">User content</h2>
          <p>
            You retain ownership of content you submit to the Service. You grant us a non-exclusive,
            worldwide license to host, store, process, and display that content solely to operate and
            improve the Service. You represent that you have the rights necessary to grant this license.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Third-party services and data</h2>
          <p>
            The Service integrates third-party services (such as Google sign-in, Supabase, TMDB, email
            delivery, analytics, and optional AI-based recommendations). Your use of those services may be
            subject to their respective terms and privacy policies. Metadata and images from TMDB are
            provided by The Movie Database and subject to TMDB&apos;s terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Intellectual property</h2>
          <p>
            The Service, including its design, branding, and software, is owned by the Company or its
            licensors and is protected by intellectual property laws. Except as expressly permitted, you
            may not copy, modify, distribute, sell, or reverse engineer the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF
            ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
            THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF HARMFUL COMPONENTS.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Limitation of liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE COMPANY OR ITS AFFILIATES,
            OFFICERS, DIRECTORS, EMPLOYEES, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR
            OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY
            CLAIM ARISING OUT OF OR RELATING TO THE SERVICE OR THESE TERMS IS LIMITED TO THE GREATER OF
            (A) THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B) ONE
            HUNDRED U.S. DOLLARS (US$100), IF YOU HAVE NOT PAID US. SOME JURISDICTIONS DO NOT ALLOW
            CERTAIN LIMITATIONS; IN THOSE JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE FULLEST EXTENT
            PERMITTED BY LAW.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Indemnity</h2>
          <p>
            You will defend, indemnify, and hold harmless the Company and its affiliates from any claims,
            damages, losses, and expenses (including reasonable attorneys&apos; fees) arising from your
            use of the Service, your content, or your violation of these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Termination</h2>
          <p>
            We may suspend or terminate your access to the Service at any time, with or without cause
            or notice, including for violation of these Terms. You may stop using the Service at any time.
            Provisions that by their nature should survive termination (including disclaimers, limitation
            of liability, indemnity, and governing law) will survive.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Texas, without regard to conflict of
            law principles. You agree that the state and federal courts located in Texas will have
            exclusive jurisdiction over disputes arising from these Terms or the Service, subject to any
            mandatory consumer protections in your jurisdiction.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Changes to these Terms</h2>
          <p>
            We may modify these Terms at any time. We will post the updated Terms on this page and update
            the &quot;Last updated&quot; date. If changes are material, we may provide additional notice
            (for example, via the Service or email). Continued use after changes become effective
            constitutes acceptance of the revised Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and the Company regarding the
            Service. If any provision is unenforceable, the remaining provisions remain in effect. Our
            failure to enforce a provision is not a waiver. You may not assign these Terms without our
            consent; we may assign them in connection with a merger, acquisition, or sale of assets.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Contact</h2>
          <p>
            Questions about these Terms:{' '}
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
