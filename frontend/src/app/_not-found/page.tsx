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
    </div>
  );
} 