import type { Track } from "../types";

interface Props {
  track: Track;
  onClick?: () => void;
}

/** A compact album-art + name + artists row, used in the search dropdown. */
export function TrackRow({ track, onClick }: Props) {
  return (
    <div className="track-row" onClick={onClick} role={onClick ? "button" : undefined}>
      {track.image ? (
        <img className="track-art" src={track.image} alt="" />
      ) : (
        <div className="track-art" />
      )}
      <div className="track-meta">
        <div className="track-name">{track.name}</div>
        <div className="track-artists">{track.artists.join(", ")}</div>
      </div>
    </div>
  );
}
