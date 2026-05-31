import type { Track } from "../types";

interface Props {
  track: Track;
}

/**
 * A similar-song result: a Spotify embed (plays full tracks for logged-in
 * Premium users, 30s previews otherwise) plus an explicit open-in-Spotify link.
 */
export function ResultCard({ track }: Readonly<Props>) {
  return (
    <div className="result-card">
      <div className="embed-wrap">
        <iframe
          title={`${track.name} by ${track.artists.join(", ")}`}
          src={`https://open.spotify.com/embed/track/${track.id}`}
          loading="lazy"
          allow="encrypted-media"
        />
      </div>
      <a className="open-link" href={track.url} target="_blank" rel="noreferrer">
        Open in Spotify ↗
      </a>
    </div>
  );
}
