import { config } from "./config.js";

/** A normalized track shape the frontend consumes. */
export interface Track {
  id: string;
  name: string;
  artists: string[];
  album: string;
  /** Album art URL (medium size), or null if unavailable. */
  image: string | null;
  /** open.spotify.com link to the track. */
  url: string;
}

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API_BASE = "https://api.spotify.com/v1";

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Client Credentials flow: app-level token, no user login. Good enough for
 * search + track metadata. Tokens last ~1h; we cache and refresh with a margin.
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value;
  }

  const basic = Buffer.from(
    `${config.spotify.clientId}:${config.spotify.clientSecret}`,
  ).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    // refresh 60s early to avoid edge-of-expiry failures
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

async function spotifyGet<T>(path: string): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Spotify API ${path} failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

interface SpotifyApiTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  external_urls: { spotify: string };
}

function normalize(t: SpotifyApiTrack): Track {
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name),
    album: t.album.name,
    // images are ordered largest-first; index 1 is a reasonable medium size
    image: t.album.images[1]?.url ?? t.album.images[0]?.url ?? null,
    url: t.external_urls.spotify,
  };
}

export async function searchTracks(query: string, limit = 10): Promise<Track[]> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  const data = await spotifyGet<{ tracks: { items: SpotifyApiTrack[] } }>(
    `/search?${params.toString()}`,
  );
  return data.tracks.items.map(normalize);
}

/**
 * Resolve a free-text "artist - title" pair (from Last.fm) to the best Spotify
 * track match. Returns null when nothing reasonable is found.
 */
export async function findTrack(artist: string, title: string): Promise<Track | null> {
  const results = await searchTracks(`track:${title} artist:${artist}`, 1);
  return results[0] ?? null;
}
