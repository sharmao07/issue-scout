# Issue Scout

Issue Scout is a web application that helps you discover public GitHub issues suited to your interests and experience level.

## Try it

You can try the live application here:

https://issue-scout-chi.vercel.app/

## Features

- **Search public GitHub issues:** Find issues using keyword search queries.
- **Filter results:** Filter by programming language, labels, estimated skill level, creation time, and issue status (open, closed, or any).
- **Pagination:** Navigate through results page by page.
- **Issue details:** View full issue descriptions and links to original GitHub issues.
- **Readiness and repository checks:** View repository metadata (stars, forks, open issues) and automated contribution readiness signals where available.
- **Save issues:** Bookmark issues to review later. Saved issues remain stored in your browser.
- **Contribution progress:** Track contribution steps with a checklist, record your status and personal notes, and save pull request links.
- **Shareable search links:** Copy and share search URLs that preserve your query and selected filters.

## Quick start

To run Issue Scout locally:

```bash
git clone https://github.com/sharmao07/issue-scout.git
cd issue-scout
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

No environment variables or API keys are required for basic usage.

## Requirements and commands

### Requirements

- Node.js 20 or newer
- npm

### Useful commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the local development server |
| `npm run test` | Runs the test suite with Vitest |
| `npm run lint` | Lints the codebase with ESLint |
| `npm run build` | Builds the project for production |

## How it works

Issue Scout is built using Next.js, React, TypeScript, and Tailwind CSS.

- **GitHub data fetching:** Next.js route handlers fetch public issue and repository information from the GitHub REST API.
- **Skill level estimates:** Difficulty estimates (beginner, intermediate, advanced) are suggestions based on issue labels and text. They are guidance only, not guarantees.
- **Readiness scoring:** The readiness score checks repository documentation (such as `CONTRIBUTING.md`) and issue activity to help gauge how prepared an issue is for contributors.
- **Browser-local storage:** Saved bookmarks and contribution progress are kept in browser `localStorage`. No external database or account is required.

## Credits and license

### Credits

- [GitHub REST API](https://docs.github.com/en/rest) for publicly available issue and repository information.
- [Next.js](https://nextjs.org/) and [React](https://react.dev/) for the application framework.
- [Tailwind CSS](https://tailwindcss.com/) for styling.
- [Vitest](https://vitest.dev/) for automated testing.

### License

Issue Scout is licensed under the MIT License. See [LICENSE.md](LICENSE.md) for details.
