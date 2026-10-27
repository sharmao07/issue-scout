<h1 align="center">Issue Scout</h1>

<p align="center"><strong>Discover public GitHub issues suited to your skills and interests.</strong><br>
A simple, focused tool to find open-source contribution opportunities.</p>

<p align="center">
  <a href="https://issue-scout-chi.vercel.app/"><img src="https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel" alt="Live App"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="https://issue-scout-chi.vercel.app/"><strong>Live App</strong></a> ·
  <a href="#why-issue-scout">Why Issue Scout</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#how-it-works">How It Works</a>
</p>

## Why Issue Scout

- **Focused on discovery.** Quickly filter through public GitHub issues by keyword, programming language, label, time, and status.
- **Skill level guidance.** Automated estimates (beginner, intermediate, advanced) derived from issue labels to help you pick tasks fitting your experience.
- **Repository readiness.** Check repository activity, health signals, and contribution guides before starting to code.
- **Private and local.** Bookmarks, contribution checklists, personal notes, and PR tracking are stored right in your browser's local storage. No account, no database, no tracking.
- **Free and open source** under the MIT license.

## Quick start

Needs Node.js 20 or later.

```bash
git clone https://github.com/sharmao07/issue-scout.git
cd issue-scout
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. No environment variables or API keys are required.

## Features

**Search and discovery**
- Keyword search across public GitHub issues.
- Filter by language (`JavaScript`, `TypeScript`, `Python`, `Rust`, `Go`, `C++`, etc.).
- Filter by label (`good first issue`, `help wanted`, `bug`, `documentation`).
- Filter by creation time (last 12 hours up to older) and status (`open`, `closed`, or `all`).
- Shareable search URLs that preserve your active query and filters.

**Issue inspection & readiness**
- Issue details with full descriptions and direct links to GitHub.
- Difficulty guidance (beginner, intermediate, advanced) based on issue labels.
- Automated readiness score (0–100) checking repository activity and contribution documentation.
- Live GitHub status checking to verify issue state and assignees before beginning work.

**Contribution workflow**
- Save bookmarks to a local "Saved Issues" list.
- Built-in 8-step contribution checklist.
- Local notes and status tracking (Investigating, Working, PR Opened, Completed).
- Saved pull request link for each issue.

## How it works

Issue Scout uses Next.js route handlers to query GitHub's public REST API, classify results, and serve them to a lightweight, responsive React front end.

| Component | Technology | Role |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side API proxy, caching, and page rendering |
| **UI & Styling** | React 19 + Tailwind CSS | Fast, accessible, and lightweight interface |
| **Testing** | Vitest | Fast unit test suite |
| **Persistence** | Browser `localStorage` | Keeps bookmarks, checklist progress, and notes private on your machine |

> **Note on estimates:** Skill levels and readiness scores are automated suggestions derived from issue labels and repository signals. Always check the original issue and repository guidelines before starting work.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts the local development server at `localhost:3000` |
| `npm run test` | Runs the Vitest test suite |
| `npm run lint` | Checks code formatting with ESLint |
| `npm run build` | Builds the production bundle |

## Contributing

Bug reports, suggestions, and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Issue Scout is open source under the [MIT License](LICENSE.md).

<p align="center">Made for the open source community · <a href="https://issue-scout-chi.vercel.app/">Try Issue Scout</a></p>
