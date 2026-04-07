export const dynamic = "force-dynamic";

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">404 - Page Not Found</h1>
      <p className="mb-8 text-lg text-gray-600">
        Sorry, we couldn&#39;t find the page you&#39;re looking for.
      </p>
      <Link
        href="/"
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
      >
        Return Home
      </Link>
      <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-gray-500">
        <Link href="/privacy" className="hover:text-gray-800">
          Privacy Policy
        </Link>
        <span className="text-gray-300" aria-hidden>
          ·
        </span>
        <Link href="/terms" className="hover:text-gray-800">
          Terms of Service
        </Link>
      </nav>
    </div>
  );
} 