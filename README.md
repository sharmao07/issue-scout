<h1 align="center">Issue Scout</h1>

<p align="center"><strong>Find open source issues to contribute to </strong><br></p>

<p align="center">
  <a href="https://issue-scout-chi.vercel.app/"><img src="https://img.shields.io/badge/Live%20App-Vercel-black?logo=vercel" alt="Live App"></a>
  <a href="LICENSE.md"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
</p>

<p align="center">
  <a href="#why-issue-scout">Why Issue Scout</a> ·
  <a href="#set-up-locally">Set up locally</a> ·
  <a href="#contributing">Contribute</a>·
  <a href="#license">License</a>
</p>

## Why Issue Scout?

- **Filters:** Easily filter GitHub issues by keywords, languages, labels, date and status.

- **Difficulty Estimates:** Filter between begineer, intermedate, and advanced issues.

- **Repository Insights:** Check repository activity, health and contribution guidelines before contributing.

- **Private:** Bookmarks, notes, and PR tracking all stays locally in your browser. No accounts or tracking.

- **Free and open source to use** under the MIT license.

> **Note on estimates:** Estimated skill levels and readiness scores are suggestions generated automatically based on issue labels and other repository information.


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


## Contributing

Bug reports, ideas, and pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md).

## License

Open source under [MIT License](LICENSE.md).
