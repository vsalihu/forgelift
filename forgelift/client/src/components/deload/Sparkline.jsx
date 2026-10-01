// Tiny single-series trend line with an end dot. Values are drawn oldest to newest.
const Sparkline = ({ values = [], label, color = "#fb923c", width = 120, height = 36 }) => {
  const points = values.map(Number).filter((value) => Number.isFinite(value));
  if (points.length < 2) return <span className="text-sm text-zinc-500">–</span>;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const pad = 4;
  const coords = points.map((value, index) => [
    pad + (index / (points.length - 1)) * (width - pad * 2),
    pad + (1 - (value - min) / span) * (height - pad * 2)
  ]);
  const path = coords.map(([x, y], index) => `${index ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lastX, lastY] = coords[coords.length - 1];
  return (
    <svg aria-label={`${label}: ${points.join(", ")}`} className="block max-w-full" height={height} role="img" viewBox={`0 0 ${width} ${height}`} width={width}>
      <path d={path} fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <circle cx={lastX} cy={lastY} fill={color} r="3" stroke="#0b0d10" strokeWidth="2" />
    </svg>
  );
};

export default Sparkline;
