import type { Track } from "./types";

// In dev this is empty, so requests hit "/api/*" and the Vite proxy forwards
// them to the local backend. In production set VITE_API_BASE_URL to the
// deployed backend origin.
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return (await res.json()) as T;
}

export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
  const data = await jsonOrThrow<{ tracks: Track[] }>(res);
  return data.tracks;
}

export async function getSimilar(seeds: Track[]): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/api/similar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seeds }),
  });
  const data = await jsonOrThrow<{ tracks: Track[] }>(res);
  return data.tracks;
}
