import { config } from "./config.js";

const API_BASE = "https://ws.audioscrobbler.com/2.0/";

export interface SimilarSeed {
  artist: string;
  title: string;
}

export interface LastfmSimilar {
  artist: string;
  title: string;
  /** Last.fm similarity score, 0..1. */
  match: number;
}

interface LastfmTrackGetSimilarResponse {
  similartracks?: {
    track?: {
      name: string;
      match: string;
      artist: { name: string };
    }[];
  };
  error?: number;
  message?: string;
}

/**
 * Last.fm track.getSimilar — behaviour-based "people who listen to X also
 * listen to Y" similarity. This is our similarity engine since Spotify
 * deprecated /recommendations and /audio-features for new apps (Nov 2024).
 */
export async function getSimilarTracks(
  seed: SimilarSeed,
  limit = 20,
): Promise<LastfmSimilar[]> {
  const params = new URLSearchParams({
    method: "track.getsimilar",
    artist: seed.artist,
    track: seed.title,
    api_key: config.lastfm.apiKey,
    format: "json",
    limit: String(limit),
    autocorrect: "1",
  });

  let data: LastfmTrackGetSimilarResponse;
  try {
    const res = await fetch(`${API_BASE}?${params.toString()}`);
    if (!res.ok) {
      console.warn(
        `Last.fm request failed (${res.status}) for ${seed.artist} - ${seed.title}`,
      );
      return [];
    }
    data = (await res.json()) as LastfmTrackGetSimilarResponse;
  } catch (err) {
    console.warn(`Last.fm request errored for ${seed.artist} - ${seed.title}:`, err);
    return [];
  }

  if (data.error) {
    // Unknown track etc. — treat as "no similar results" rather than failing
    // the whole request, since one bad seed shouldn't sink the others.
    return [];
  }

  return (data.similartracks?.track ?? []).map((t) => ({
    artist: t.artist.name,
    title: t.name,
    match: Number(t.match) || 0,
  }));
}
