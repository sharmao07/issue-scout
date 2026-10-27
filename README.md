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

## Reasons for Issue Scout

- **Built for discovery.** Easily narrow down public GitHub issues using keywords, programming languages, tags, time frame, and issue status.
- **Determines skill levels.** Automatically determined beginner, intermediate, or advanced estimates based on the labels of the issues to find the right tasks for you.
- **Repository ready.** Determine the repository activity, health and contribution guidelines before coding.
- **Private & local storage.** Bookmarks, contribution guidelines, personal notes, and pull request tracker are all stored locally in your browser. No need for account, no database, no tracking.
- **Open source project** available under the MIT license.

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
- Search using keywords in the public GitHub issues.
- Filtering by programming language (`JavaScript`, `TypeScript`, `Python`, `Rust`, `Go`, `C++`, and so on).
- Filtering by labels (`good first issue`, `help wanted`, `bug`, `documentation`).
- Filtering by creation date (last 12 hours through older ones) and status (`open`, `closed`, or `all`).
- Shareable search URLs that contain your current query and filter settings.

**Issue inspection & preparation**
- Detailed issues with complete description and direct link to Github.
- Difficulty levels (beginner, intermediate, advanced) according to Github tags.
- Readiness score automated (0-100), assessing repository activity and contribution documents.
- Real time Github status check for verifying status and assignee of issues before starting work.

**Contribution process**
- Bookmark any issue to a local "Saved Issues" list.
- 8 steps contribution checklist included.
- Notes and status updates for issues (Investigating, Working, PR Opened, Completed).
- Saved link for pull request made for each issue.

## How it works

Issue Scout uses Next.js routes to call the REST API of GitHub, categorize them, and then provide them to a lightweight and responsive React interface.

| Component | Technology | Function |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server side proxy for the API, caching, and rendering of pages |
| **UI and Design** | React 19 + Tailwind CSS | Fast and accessible user interface |
| **Testing** | Vitest | Fast tests of codebase |
| **Persistence** | Browser `localStorage` | Maintains bookmarks, checklist items, and notes locally on your machine |

> **Note on estimates:** Estimated skill levels and readiness scores are suggestions generated automatically based on issue labels and other repository information. Please refer to the original repository and issue before you get started.

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts the local development server at `localhost:3000` |
| `npm run test` | Runs the Vitest test suite |
| `npm run lint` | Checks code formatting with ESLint |
| `npm run build` | Builds the production bundle |

## Contributing

The UI for Issue Scout is still under development, and I'm currently working on improving it. If you can help with making the interface easy to understand and use, that would be great.

If you have any contributions, especially regarding the UI, accessibility improvements, better mobile layouts, and usability suggestions, feel free to create an issue or make a pull request.

However, ensure that the interface remains simple and search filters and other functionalities remain unaffected.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## License

Issue Scout is an open source software released under the [MIT License](LICENSE.md).

<p align="center">Built for the open source community · <a href="https://issue-scout-chi.vercel.app/">Use Issue Scout</a></p>
