# Music Market UI

A minimal Robinhood-style web interface for a simulated music stock market.

## Run locally

```bash
python3 -m http.server 8000
```

Open <http://localhost:8000>

## Deploy to GitHub Pages

1. Create a new GitHub repository and push this project to the `main` branch.
2. In GitHub, go to **Settings -> Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`; the workflow in `.github/workflows/pages.yml` deploys automatically.

Public URL format:

- `https://<your-github-username>.github.io/<repo-name>/`

Example:

- `https://octocat.github.io/music-market-ui/`
