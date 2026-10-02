import { useMemo } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { ACCENT, AXIS, GRID, axisProps, tooltipProps } from "./chartTheme.js";
import { describeEta, formatLongDate, formatNumber, formatShortDate, toTime } from "./format.js";

const RankJourneyChart = ({ rankJourney }) => {
  const { history = [], projection, tiers = [], current, nextRankEta, maxEta } = rankJourney || {};

  const rows = useMemo(() => {
    const past = history.map((point) => ({ t: toTime(point.date), score: point.score, xp: point.xp }));
    const future = (projection?.points || []).map((point) => ({
      t: toTime(point.date),
      expected: point.expected,
      range: [point.low, point.high]
    }));
    return [...past, ...future].sort((a, b) => a.t - b.t);
  }, [history, projection]);

  const { domain, bands } = useMemo(() => {
    const values = rows.flatMap((row) => [row.score, ...(row.range || [])]).filter((value) => value !== undefined);
    if (!values.length) return { domain: [0, 1000], bands: [] };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const floorTier = [...tiers].reverse().find((tier) => tier.minScore <= min) || tiers[0];
    const ceilingTier = tiers.find((tier) => tier.minScore > max);
    const lower = floorTier?.minScore || 0;
    const upper = ceilingTier ? ceilingTier.minScore : Math.ceil(max * 1.05);

    const visible = tiers
      .map((tier, index) => ({ ...tier, top: tiers[index + 1]?.minScore ?? upper }))
      .filter((tier) => tier.top > lower && tier.minScore < upper)
      .map((tier) => ({ name: tier.name, y1: Math.max(tier.minScore, lower), y2: Math.min(tier.top, upper) }));
    return { domain: [lower, upper], bands: visible };
  }, [rows, tiers]);

  const goesToMax = current?.nextRank === "Ultimate";

  return (
    <ChartCard
      title="Rank & XP journey"
      description="Your overall rank score over time. Each shaded band is a rank tier. The dotted line shows where your current pace takes you."
      empty={!history.length}
      emptyMessage="Log a few workouts to start your rank journey."
      table={{
        columns: [
          { key: "date", label: "Date" },
          { key: "score", label: "Rank score" },
          { key: "xp", label: "XP" },
          { key: "expected", label: "Projected score" }
        ],
        rows: rows.map((row) => ({
          date: formatLongDate(row.t),
          score: row.score !== undefined ? formatNumber(row.score, 0) : "",
          xp: row.xp !== undefined ? formatNumber(row.xp, 0) : "",
          expected: row.expected !== undefined ? formatNumber(row.expected, 0) : ""
        }))
      }}
      footer={
        current ? (
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
              <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Now</dt>
              <dd className="mt-1 font-bold text-white">
                {current.rank} · {formatNumber(current.score, 0)} pts
              </dd>
            </div>
            {current.nextRank ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  {current.nextRank} ({formatNumber(current.pointsToNextRank, 0)} pts to go)
                </dt>
                <dd className="mt-1 font-bold text-white">{describeEta(nextRankEta, { ceilingLabel: " pts" })}</dd>
              </div>
            ) : null}
            {!goesToMax ? (
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Max rank (Ultimate)</dt>
                <dd className="mt-1 font-bold text-white">{current.nextRank ? describeEta(maxEta, { ceilingLabel: " pts" }) : "Reached"}</dd>
              </div>
            ) : null}
          </dl>
        ) : null
      }
    >
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            {bands.map((band, index) => (
              <ReferenceArea
                fill={index % 2 ? "rgba(255, 255, 255, 0.035)" : "rgba(255, 255, 255, 0)"}
                ifOverflow="hidden"
                key={band.name}
                label={(band.y2 - band.y1) / (domain[1] - domain[0]) >= 0.08 ? { value: band.name, position: "insideTopLeft", fill: AXIS, fontSize: 11 } : undefined}
                y1={band.y1}
                y2={band.y2}
              />
            ))}
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis {...axisProps} dataKey="t" domain={["dataMin", "dataMax"]} minTickGap={32} scale="time" tickFormatter={formatShortDate} type="number" />
            <YAxis {...axisProps} domain={domain} tickFormatter={(value) => formatNumber(value, 0)} width={56} />
            <Tooltip
              {...tooltipProps}
              formatter={(value, name) => {
                if (name === "range") return [`${formatNumber(value[0], 0)} - ${formatNumber(value[1], 0)}`, "Likely range"];
                return [formatNumber(value, 0), name === "score" ? "Rank score" : "Projected"];
              }}
              labelFormatter={formatLongDate}
            />
            <Area activeDot={false} dataKey="range" fill={ACCENT} fillOpacity={0.14} isAnimationActive={false} stroke="none" type="monotone" />
            <Line connectNulls dataKey="score" dot={{ r: 3, strokeWidth: 0, fill: ACCENT }} isAnimationActive={false} stroke={ACCENT} strokeWidth={2} type="monotone" />
            <Line connectNulls dataKey="expected" dot={false} isAnimationActive={false} stroke={ACCENT} strokeDasharray="5 5" strokeWidth={2} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default RankJourneyChart;
