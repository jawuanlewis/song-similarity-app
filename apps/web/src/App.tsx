import { useState } from "react";
import { getSimilar } from "./api";
import { ResultCard } from "./components/ResultCard";
import { SearchBar } from "./components/SearchBar";
import { SeedChips } from "./components/SeedChips";
import type { Track } from "./types";

const MAX_SEEDS = 5;

export function App() {
  const [seeds, setSeeds] = useState<Track[]>([]);
  const [results, setResults] = useState<Track[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSeed(track: Track) {
    setSeeds((prev) => {
      if (prev.some((t) => t.id === track.id) || prev.length >= MAX_SEEDS) {
        return prev;
      }
      return [...prev, track];
    });
  }

  function removeSeed(id: string) {
    setSeeds((prev) => prev.filter((t) => t.id !== id));
  }

  async function findSimilar() {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const tracks = await getSimilar(seeds.map((s) => s.id));
      setResults(tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Soundalike</h1>
        <p>Pick songs you love, get a list of similar ones.</p>
      </header>

      <SearchBar onSelect={addSeed} />
      <SeedChips seeds={seeds} onRemove={removeSeed} />

      <div className="actions">
        <button
          className="btn-primary"
          disabled={seeds.length === 0 || loading}
          onClick={findSimilar}
        >
          {loading ? "Finding…" : "Find similar songs"}
        </button>
      </div>

      <section className="results">
        {error && <p className="status error">{error}</p>}
        {!error && results?.length === 0 && (
          <p className="status">No similar songs found. Try different picks.</p>
        )}
        {results && results.length > 0 && (
          <>
            <p className="section-label">Similar songs</p>
            <div className="results-grid">
              {results.map((track) => (
                <ResultCard key={track.id} track={track} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
