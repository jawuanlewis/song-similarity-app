import { getSimilarTracks, type LastfmSimilar } from "./lastfm.js";
import { findTrack, type Track } from "./spotify.js";

/** Minimal seed shape sent by the frontend (a subset of Track). */
export interface Seed {
  id: string;
  name: string;
  artists: string[];
}

const PER_SEED_LIMIT = 20;
const MAX_RESULTS = 24;

function key(artist: string, title: string): string {
  return `${artist}::${title}`.toLowerCase();
}

/**
 * Given seed tracks (with metadata already supplied by the client), return
 * similar tracks resolved back to playable Spotify tracks.
 *
 * Pipeline: seeds -> Last.fm similar -> merge & rank -> resolve each back to a
 * Spotify track (via Search) -> dedupe -> top N.
 */
export async function getSimilarForSeeds(seeds: Seed[]): Promise<Track[]> {
  if (seeds.length === 0) return [];

  const seedKeys = new Set(seeds.map((s) => key(s.artists[0] ?? "", s.name)));
  const seedIds = new Set(seeds.map((s) => s.id));

  // Gather Last.fm similar tracks for every seed in parallel.
  const perSeed = await Promise.all(
    seeds.map((s) =>
      getSimilarTracks({ artist: s.artists[0] ?? "", title: s.name }, PER_SEED_LIMIT),
    ),
  );

  // Merge across seeds: a track suggested by multiple seeds ranks higher.
  const merged = new Map<string, LastfmSimilar & { score: number }>();
  for (const list of perSeed) {
    for (const cand of list) {
      const k = key(cand.artist, cand.title);
      if (seedKeys.has(k)) continue; // don't recommend the seeds themselves
      const existing = merged.get(k);
      if (existing) {
        existing.score += cand.match;
      } else {
        merged.set(k, { ...cand, score: cand.match });
      }
    }
  }

  const ranked = [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS);

  // Resolve each candidate to a real Spotify track. Some won't match and are
  // dropped. De-dupe by Spotify id in case fuzzy matches collide.
  const resolved = await Promise.all(
    ranked.map((c) => findTrack(c.artist, c.title)),
  );

  const seen = new Set(seedIds);
  const out: Track[] = [];
  for (const track of resolved) {
    if (!track || seen.has(track.id)) continue;
    seen.add(track.id);
    out.push(track);
  }
  return out;
}
