<h1 align="center">Issue Scout</h1>

<p align="center"><strong>Want to contribute to open source projects? But no idea where to start from?</strong><br>

<p align="center"><strong>Discover public GitHub issues and filter them to your skills and interests.</strong><br>
Issue scout is a simple, focused tool to find open source contribution opportunities,  Discover public GitHub issues suited to your skills and interests.</p>

<p align="center">
  <a href="https://issue-scout-chi.vercel.app/"><img src="https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel" alt="Live App"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js"></a>
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#why-issue-scout">Why Issue Scout</a> ·
  <a href="#set-up-locally">Set up locally</a> ·
  <a href="#features">Features</a> ·
</p>

## Why Issue Scout?

- **Filters to search from** Easily search public GitHub issues using keywords, programming languages, tags, time frame, and issue status.
- **Determines issue level** Automatically determines beginner, intermediate, or advanced estimates based on the labels of the issues to find the right tasks for you.
- **Repository ready** Determine the repository activity, health and contribution guidelines before coding.
- **Private** Bookmarks, personal notes, and pull request tracker are all stored locally in your browser. No account, no database, no tracking.
- **Free and open source to use** under the MIT license.

> **Note on estimates:** Estimated skill levels and readiness scores are suggestions generated automatically based on issue labels and other repository information. Please refer to the original repository and issue before you get started.


## Set up locally


Needs Node.js 20 or later.

```bash
git clone https://github.com/sharmao07/issue-scout.git
cd issue-scout
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** Issue Scout uses Next.js routes to call the REST API of GitHub, categorize them, and then provide them to a lightweight and responsive React interface.


## Features

**Search**
- Search using keywords in the public GitHub issues.
- Filtering by programming language, labels, creation date, >**Adding soon:** stars on repo, and more.
- Shareable search URLs that contain your current query and filter settings.

**Issue inspection**
- Detailed issues with complete description and direct link to Github.
- Readiness score automated (0-100), assessing repository activity and contribution documents.
- Real time Github status check for verifying status and assignee of issues before starting work.

**Contribution process**
- Bookmark any issue to a local "Saved Issues" list.
- Includes a 8 steps contribution checklist.
- Notes and status updates for issues.


## Commands

| Command | Action |
|---|---|
| `npm run dev` | Starts the local development server at `localhost:3000` |
| `npm run test` | Runs the Vitest test suite |
| `npm run lint` | Checks code formatting with ESLint |
| `npm run build` | Builds the production bundle |

## Contributing

Bug reports, ideas, and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Open source under [MIT License](LICENSE.md).
