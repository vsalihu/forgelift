import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { ACCENT, axisProps, barTooltipCursor, tooltipProps } from "./chartTheme.js";
import { formatLongDate, formatNumber, formatShortDate, toTime } from "./format.js";

const PrTooltip = ({ active, payload, unit }) => {
  if (!active || !payload?.length) return null;
  const week = payload[0].payload;
  return (
    <div style={tooltipProps.contentStyle} className="max-w-64 px-3 py-2">
      <p className="text-xs text-slate-400">Week of {formatLongDate(week.t)}</p>
      <p className="font-bold text-white">
        {week.count} new record{week.count === 1 ? "" : "s"}
      </p>
      {week.highlights.map((highlight) => (
        <p className="text-xs text-slate-300" key={highlight.exerciseName}>
          {highlight.exerciseName}: {formatNumber(highlight.value)} {unit} (+{formatNumber(highlight.improvementPercent)}%)
        </p>
      ))}
    </div>
  );
};

const PrTimelineChart = ({ weeks = [], unit }) => {
  const rows = weeks.map((week) => ({ ...week, t: toTime(week.weekStart) }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const bestWeek = [...rows].sort((a, b) => b.count - a.count)[0];

  return (
    <ChartCard
      title="PR timeline"
      description="New personal records per week (a new best estimated max on any lift). Your very first session of a lift isn't counted. Hover a bar to see which lifts improved."
      empty={!total}
      emptyMessage="No new records in this period yet. Keep adding a little weight or a rep."
      table={{
        columns: [
          { key: "week", label: "Week of" },
          { key: "count", label: "New records" },
          { key: "lifts", label: "Biggest jumps" }
        ],
        rows: rows
          .filter((row) => row.count)
          .map((row) => ({
            week: formatLongDate(row.t),
            count: row.count,
            lifts: row.highlights.map((highlight) => `${highlight.exerciseName} +${formatNumber(highlight.improvementPercent)}%`).join(", ")
          }))
      }}
      footer={
        total ? (
          <p className="text-sm leading-6 text-slate-300">
            <span className="font-bold text-white">{total}</span> new records in this period. Best week: {formatShortDate(bestWeek.t)} with{" "}
            <span className="font-bold text-white">{bestWeek.count}</span>.
          </p>
        ) : null
      }
    >
      <div className="h-64">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
            <XAxis {...axisProps} dataKey="t" minTickGap={24} tickFormatter={formatShortDate} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip content={<PrTooltip unit={unit} />} cursor={barTooltipCursor} />
            <Bar dataKey="count" fill={ACCENT} isAnimationActive={false} maxBarSize={28} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default PrTimelineChart;
