import type { Track } from "../types";

interface Props {
  seeds: Track[];
  onRemove: (id: string) => void;
}

/** The set of selected seed tracks, shown as removable chips. */
export function SeedChips({ seeds, onRemove }: Readonly<Props>) {
  if (seeds.length === 0) return null;
  return (
    <div className="selected">
      <p className="section-label">Selected songs</p>
      <div className="chips">
        {seeds.map((track) => (
          <span className="chip" key={track.id}>
            {track.name} — {track.artists[0]}
            <button
              type="button"
              aria-label={`Remove ${track.name}`}
              onClick={() => onRemove(track.id)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
