# Soundalike

Search for songs, pick one or more, and get a list of similar tracks you can
play right there. Spotify-themed, minimal v1.

## How it works

Spotify deprecated its `/recommendations` and `/audio-features` endpoints for
new apps in November 2024, so similarity comes from **Last.fm** instead:

1. You search and pick seed tracks (Spotify Search API).
2. The backend looks up each seed's similar tracks (Last.fm `track.getSimilar`).
3. Those results are merged, ranked, and resolved back to Spotify tracks.
4. The frontend shows each as a Spotify embed player + an "Open in Spotify" link.

```text
apps/web   React + Vite + TypeScript  (UI)
apps/api   Fastify + TypeScript       (Spotify + Last.fm integration)
```

## Prerequisites

- Node 20+ and pnpm
- A Spotify app: <https://developer.spotify.com/dashboard> → Client ID + Secret
- A Last.fm API key: <https://www.last.fm/api/account/create>

## Setup

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in your keys
```

## Run

```bash
pnpm dev          # starts web (5173) and api (3001) together
```

Open <http://localhost:5173>. The web dev server proxies `/api` to the backend,
so there's nothing else to configure.

## Deployment

The frontend and backend deploy from this one repo as two projects, each
pointed at its own subdirectory.

### Backend → Railway (`apps/api`)

- **Root Directory:** `apps/api`
- **Build:** `pnpm install && pnpm build`
- **Start:** `pnpm start`
- **Env vars:** `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `LASTFM_API_KEY`,
  and `CORS_ORIGIN` set to the deployed frontend URL (e.g.
  `https://your-app.vercel.app`). `PORT` is injected by Railway automatically.

The server binds `0.0.0.0` so the container is reachable.

### Frontend → Vercel (`apps/web`)

- **Root Directory:** `apps/web` (Vercel auto-detects Vite + pnpm)
- **Env var:** `VITE_API_BASE_URL` = the deployed backend origin, no trailing
  slash (e.g. `https://your-api.up.railway.app`).

### Order of operations

1. Deploy the backend first to get its URL.
2. Set `VITE_API_BASE_URL` on Vercel to that URL and deploy the frontend.
3. Set `CORS_ORIGIN` on Railway to the Vercel URL and redeploy the backend.

> Spotify's Client Credentials flow needs no redirect URI and isn't subject to
> the 25-user dev-mode cap (that applies to user-login flows), so sharing with
> family/friends works without a quota extension.

## Notes

- v1 uses Spotify's Client Credentials flow — no user login. Reading a user's
  own library or saving playlists later would require the Authorization Code
  (PKCE) flow.
- Last.fm → Spotify matching is fuzzy; the occasional track won't resolve and
  is dropped from results.
