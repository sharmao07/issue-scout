import Link from "next/link";

export default function SearchHeader() {
  return (
    <header className="border-b border-gray-300 pb-3 mb-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            <Link href="/" className="text-gray-900 no-underline hover:underline">
              Issue Scout
            </Link>
          </h1>
          <p className="text-xs text-gray-600">
            Find GitHub issues to work on.
          </p>
        </div>

        <div>
          <a
            href="https://github.com/sharmao07/issue-scout"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-600 underline hover:text-blue-800"
          >
            GitHub repository
          </a>
        </div>
      </div>
    </header>
  );
}
