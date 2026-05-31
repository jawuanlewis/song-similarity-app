import { useEffect, useRef, useState } from "react";
import { searchTracks } from "../api";
import type { Track } from "../types";
import { TrackRow } from "./TrackRow";

interface Props {
  onSelect: (track: Track) => void;
}

export function SearchBar({ onSelect }: Readonly<Props>) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search as the user types.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      searchTracks(q)
        .then((tracks) => {
          setResults(tracks);
          setOpen(true);
        })
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(track: Track) {
    onSelect(track);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef}>
      <div className="search">
        <input
          type="text"
          value={query}
          placeholder="Search for a song…"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="dropdown">
          {results.map((track) => (
            <TrackRow key={track.id} track={track} onClick={() => handleSelect(track)} />
          ))}
        </div>
      )}
    </div>
  );
}
