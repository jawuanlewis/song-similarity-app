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

## Notes

- v1 uses Spotify's Client Credentials flow — no user login. Reading a user's
  own library or saving playlists later would require the Authorization Code
  (PKCE) flow.
- Last.fm → Spotify matching is fuzzy; the occasional track won't resolve and
  is dropped from results.
