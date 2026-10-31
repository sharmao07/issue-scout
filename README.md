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
  <a href="#contributing">Contribute</a>·
  <a href="#license">License</a>
</p>

## Why Issue Scout?

- **Filters:** Easily filter GitHub issues by keywords, languages, labels, date and status.
- **Difficulty Estimates:** Filter between begineer, intermedate, and advanced issues.
- **Repository Insights:** Check repository activity, health and contribution guidelines before contributing.
- **Private:** Bookmarks, notes, and PR tracking all stays locally in your browser. No accounts or tracking.
- **Free and open source to use** under the MIT license.

> **Note on estimates:** Estimated skill levels and readiness scores are suggestions generated automatically based on issue labels and other repository information. Please refer to the original repository and issue before you get started.


## Features

**Search**
- Search issues by keywords, languages, labels, date, and status.
- Shareable URLs preserve search queries and filters.
- Star based repos and other filters to search issues coming soon.

**Issue inspection**
- View issue details and GitHub links.
- Readiness score (0-100) based on repo activity and contribution guides.
- Live status and assignee checks.

**Contribution process**
- Bookmark any issue to a local "Saved Issues" list.
- Includes a 8 steps contribution checklist.
- Track progress using notes and status updates.


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
