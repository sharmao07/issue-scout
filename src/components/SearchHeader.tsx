import Link from "next/link";

export default function SearchHeader() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-white/10 py-4">
        <Link
          href="/"
          aria-label="Issue Scout home"
          className="text-lg font-bold tracking-tight sm:text-xl"
        >
          ISSUE<span className="text-cyan-300">SCOUT</span>
          <span className="ml-2 hidden text-xs font-medium tracking-normal text-slate-500 sm:inline">
            OPEN SOURCE DISCOVERY
          </span>
        </Link>

        <a
          href="https://github.com/sharmao07/issue-scout"
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-white/15 px-3 py-2 font-mono text-xs uppercase tracking-wide transition hover:border-cyan-300/50 hover:bg-white/5"
        >
          GitHub <span aria-hidden="true">↗</span>
        </a>
      </header>

      <div className="mb-9 max-w-3xl pt-12 sm:pt-16">
        <p className="mb-5 font-mono text-xs uppercase tracking-[0.14em] text-cyan-200">
          [ Open-source issue discovery ]
        </p>

        <h1 className="text-4xl font-semibold leading-[1.05] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
          Find issues.
          <br />
          Build something <span className="text-cyan-300">real.</span>
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
          Discover open-source opportunities that match your interests, preferred technologies and experience.
          Find an issue and start contributing.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 border-y border-white/10 sm:grid-cols-3">
        <div className="flex gap-3 border-b border-white/10 py-4 sm:border-b-0 sm:border-r sm:pr-4">
          <span className="font-mono text-xs text-cyan-300">01</span>
          <div>
            <p className="text-sm font-semibold">Search</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Find public GitHub issues.
            </p>
          </div>
        </div>

        <div className="flex gap-3 border-b border-white/10 py-4 sm:border-b-0 sm:border-r sm:px-4">
          <span className="font-mono text-xs text-cyan-300">02</span>
          <div>
            <p className="text-sm font-semibold">Refine</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Filter by skills and interests.
            </p>
          </div>
        </div>

        <div className="flex gap-3 py-4 sm:pl-4">
          <span className="font-mono text-xs text-cyan-300">03</span>
          <div>
            <p className="text-sm font-semibold">Contribute</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Open an issue on GitHub.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
