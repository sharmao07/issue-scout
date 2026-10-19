# Issue Scout

**Discover GitHub issues that fit your interests, tools, and experience.**

Issue Scout is an open-source discovery tool that searches public GitHub issues and helps you narrow them down by keyword, programming language, label, estimated skill level, creation date, and issue status.

- **Live app:** https://issue-scout-chi.vercel.app/
- **Source code:** https://github.com/sharmao07/issue-scout

> Skill levels are best-effort suggestions based on issue labels, not guarantees. Always read the original issue and the repository's contribution guidelines before starting work.

## Use the app

1. Open [Issue Scout](https://issue-scout-chi.vercel.app/).
2. Enter a topic such as `Python`, `documentation`, or `bug`. Quick-start presets can help you get started faster.
3. Narrow the results with the available filters.
4. Select **Find issues**. Use **Previous** and **Next** to browse result pages.
5. Open a result on GitHub, read its description and contribution guidelines, and check that it is still suitable to work on.

### Available filters

| Filter | What it does |
| --- | --- |
| Keyword | Searches public GitHub issues using your search terms. |
| Programming language | Narrows the search to repositories associated with that language. |
| Issue label | Filters by a GitHub label, such as `good first issue`, `help wanted`, `bug`, or `documentation`. |
| Suggested skill level | Groups issues into Beginner, Intermediate, Advanced, or Unspecified using labels. |
| Creation date | Choose any time, recent windows from 12 hours to 2 months, or older issues from 3 months to 1 year. |
| Issue status | Show open issues, closed issues, or either status. |
| Pagination | Browse up to 1,000 matching GitHub Search API results per query, 50 results per page. GitHub's search limits may affect what is available. |

**Tip for new contributors:** Start with open issues and the Beginner-friendly preset. If too few results appear, remove a filter or broaden your search terms.

## How skill levels are estimated

Issue Scout uses simple label-matching rules:

- **Beginner:** labels such as `good first issue`, `first-timers-only`, `beginner`, `easy`, `up for grabs`, or `starter issue`.
- **Intermediate:** labels such as `intermediate`, `medium`, or `moderate`.
- **Advanced:** labels such as `advanced`, `hard`, `difficult`, `complex`, or `expert`.
- **Unspecified:** no recognized difficulty label.

Repositories use labels differently, so these categories can be incomplete or inaccurate. A Beginner label does not guarantee that an issue is easy. The original GitHub issue is the source of truth.

## Features

- Search public GitHub issues without creating an Issue Scout account.
- Filter by keyword, programming language, label, creation date, status, and suggested skill level.
- Browse paginated results with Previous and Next controls.
- View repository, issue title and number, labels, author, comments, created/updated dates, and a short description.
- Open the original repository and issue directly on GitHub.
- Show loading, empty-result, and API error states.
- Quick-start presets for beginner-friendly issues, documentation, bug fixes, and Python (after the preset UI update is applied).

## Run locally

### Requirements

- [Node.js](https://nodejs.org/) **20.9 or newer**
- npm, which is included with Node.js

### Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/sharmao07/issue-scout.git
cd issue-scout
npm install
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required for the current version. The app queries GitHub's public Search API, so availability and rate limits depend on GitHub.

### Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Check the code with ESLint. |
| `npm run build` | Build the app for production. |
| `npm run start` | Start the production build after running `npm run build`. |

Run checks before opening a pull request:

```bash
npm run lint
npm run build
```

## API

The app exposes a Next.js route at `GET /api/issues`.

Example request:

```text
/api/issues?level=beginner&status=open&page=1
```

Supported query parameters:

| Parameter | Values / meaning |
| --- | --- |
| `q` | Optional keyword query. |
| `language` | Optional language, such as `Python`. |
| `label` | Optional GitHub issue label. |
| `level` | `all`, `beginner`, `intermediate`, `advanced`, or `unspecified`. |
| `age` | `any`, `12h`, `1d`, `2d`, `4d`, `6d`, `1w`, `2w`, `1m`, `2m`, or `older`. |
| `status` | `open`, `closed`, or `all`. |
| `page` | Page number from 1 to 20. Each page requests up to 50 results. |

The JSON response includes issue data, GitHub's matching count, the number of results available to browse, page metadata, and whether GitHub marked the result set incomplete. If GitHub rate-limits a search, wait a little and try again.

## Project structure

```text
src/
  app/
    api/issues/route.ts  # GitHub issue search endpoint
    page.tsx             # Search interface and issue results
  lib/
    skill-level.ts       # Label-based skill-level inference
  types/
    issue.ts             # Shared issue and filter types
```

## Known limitations

- The app searches public GitHub issues; it does not index private repositories.
- GitHub controls API availability, search behavior, and rate limits.
- GitHub's search endpoint limits the accessible result window, so not every matching issue is necessarily available.
- Skill level is inferred from labels, not from a complete technical review of an issue.
- Issue status and suitability can change. Confirm the latest details on GitHub before contributing.

## Roadmap

Potential future improvements include more robust difficulty inference, additional filter presets, saved searches, and optional AI-assisted issue summaries. These are ideas for future work, not features promised by the current version.

## Contributing

Bug reports, feature ideas, documentation improvements, and pull requests are welcome.

1. Fork the repository and create a focused branch.
2. Make your change and explain the behavior it improves.
3. Run `npm run lint` and `npm run build`.
4. Open a pull request with a clear summary and relevant screenshots or test details.

For feature requests, describe the problem you are trying to solve as well as your suggested solution.

## License

Issue Scout is licensed under the MIT License. See [LICENSE.md](https://github.com/sharmao07/issue-scout/blob/main/LICENSE.md).
