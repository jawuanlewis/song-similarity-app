# Project Context - `spotify-similar`

A "find similar songs" web tool: search Spotify, pick one or more seed tracks,
get a ranked list of similar tracks rendered as Spotify embed players.

## Architecture

pnpm monorepo, two workspaces under `apps/`:

- **apps/api** — Fastify + TypeScript (ESM). Holds all secrets and external
  integrations.
  - `config.ts` — env loading/validation (throws if a key is missing)
  - `spotify.ts` — Client Credentials token caching, Search, Get Tracks, and
    `findTrack(artist, title)` for resolving Last.fm hits back to Spotify
  - `lastfm.ts` — `track.getSimilar` (the similarity engine)
  - `similar.ts` — orchestration: seeds → Last.fm similar → merge/rank →
    resolve to Spotify → dedupe → top N
  - `index.ts` — routes: `GET /api/search?q=`, `POST /api/similar`
    (body: `{ seeds: {id,name,artists}[] }`)
- **apps/web** — React + Vite + TypeScript. UI only; talks to the API via `/api`
  (Vite dev proxy → :3001). Spotify-themed dark CSS in `src/styles.css`.

## Conventions

- pnpm only; Node 20+. API is ESM (`"type": "module"`, NodeNext) — relative
  imports use `.js` extensions.
- Secrets live in `apps/api/.env` (gitignored); `.env.example` is the template.
- Normalized `Track` shape is duplicated in `apps/api/src/spotify.ts` and
  `apps/web/src/types.ts` (no shared package yet — keep them in sync).

## Known decisions

- **Similarity uses Last.fm, not Spotify.** Spotify deprecated
  `/recommendations`, `/audio-features`, `/audio-analysis`, Related Artists, and
  reliable `preview_url`s for new apps on 2024-11-27. Spotify is search +
  metadata + playback only.
- **Client Credentials flow** (app-level, no user login) — sufficient for v1.
  User-specific features (library reads, playlist writes) would need Auth Code
  (PKCE).
- **Playback via Spotify embed iframe**, not `preview_url` (which is mostly null
  now). The embed plays full tracks for logged-in Premium users, 30s previews
  otherwise — no playback quota needed.
- **Do NOT call `GET /tracks` (Get Several Tracks).** It returns 403 for new
  client-credentials apps. The frontend already has seed metadata from search,
  so `/api/similar` accepts full seed objects — no server-side re-fetch. Only
  `GET /search` is used against Spotify.
- Last.fm failures are non-fatal per seed: `getSimilarTracks` returns `[]` on
  any HTTP/network error so one bad seed can't 500 the whole request.
- Seeds capped at 5; results capped at 24. Tracks that don't resolve from
  Last.fm back to Spotify are silently dropped.
- App stays in Spotify dev mode (≤25 users); no quota-extension request for v1.
