import { MdStar, MdStarBorder } from "react-icons/md";

const STAR_COLOR = "#ca8a04";
const EMPTY_COLOR = "color-mix(in srgb, var(--muted) 45%, transparent)";

/**
 * @param {object} props
 * @param {unknown} props.value — 1–5 (or null)
 * @param {number} [props.sizePx]
 */
export default function RatingStars({ value, sizePx = 20 }) {
  if (value == null || value === "") {
    return <span className="muted">—</span>;
  }
  const n = Number(value);
  if (Number.isNaN(n)) return <span className="muted">—</span>;
  const filled = Math.min(5, Math.max(0, Math.round(n)));

  return (
    <span
      className="rowflex"
      style={{ gap: 2, alignItems: "center" }}
      role="img"
      aria-label={`${filled} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) =>
        i < filled ? (
          <MdStar key={i} style={{ color: STAR_COLOR, fontSize: sizePx }} aria-hidden />
        ) : (
          <MdStarBorder key={i} style={{ color: EMPTY_COLOR, fontSize: sizePx }} aria-hidden />
        ),
      )}
    </span>
  );
}
