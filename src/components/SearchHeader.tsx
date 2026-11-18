import Link from "next/link";

export default function SearchHeader() {
  return (
    <header className="site-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="21" height="21" fill="none">
            <path d="M4.5 5.5h10.8a3.2 3.2 0 0 1 3.2 3.2v.1a3.2 3.2 0 0 1-3.2 3.2H9.2A3.2 3.2 0 0 0 6 15.2v.1a3.2 3.2 0 0 0 3.2 3.2h10.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="5" cy="5.5" r="1.5" fill="#F5B184"/>
            <circle cx="19" cy="18.5" r="1.5" fill="#F5B184"/>
          </svg>
        </div>
        <div>
          <h1 className="brand-name"><Link href="/">Issue Scout</Link></h1>
          <p className="brand-caption">A better way into open source</p>
        </div>
      </div>

      <a
        href="https://github.com/sharmao07/issue-scout"
        target="_blank"
        rel="noreferrer"
        className="header-link"
      >
        <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
          <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 .1.77 2.02 3.16 1.55.1-.73.39-1.22.7-1.5-2.48-.28-5.09-1.24-5.09-5.52 0-1.22.44-2.22 1.16-3-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.04 1.15a10.6 10.6 0 0 1 5.53 0c2.1-1.45 3.04-1.15 3.04-1.15.61 1.54.23 2.68.11 2.96.72.78 1.16 1.78 1.16 3 0 4.29-2.62 5.23-5.11 5.51.4.35.75 1.03.75 2.08v3.09c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9Z"/>
        </svg>
        View source
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M7 17 17 7M7 7h10v10"/>
        </svg>
      </a>
    </header>
  );
}
