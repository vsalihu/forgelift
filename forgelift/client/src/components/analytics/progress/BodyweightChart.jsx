import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { GRID, axisProps, tooltipProps } from "./chartTheme.js";
import { formatLongDate, formatNumber, formatShortDate, toTime } from "./format.js";

const BODYWEIGHT_COLOR = "#199e70";
const RATIO_COLOR = "#3987e5";

const paddedDomain = (values, pad) =>
  values.length ? [Math.floor((Math.min(...values) - pad) * 10) / 10, Math.ceil((Math.max(...values) + pad) * 10) / 10] : ["auto", "auto"];

const BodyweightChart = ({ bodyweight = [], lift, unit }) => {
  const weightRows = bodyweight.map((entry) => ({ t: toTime(entry.date), weight: entry.weight }));

  // Strength-to-bodyweight: each session's estimated max divided by your latest weigh-in at that time.
  const ratioRows = useMemo(() => {
    if (!lift || !weightRows.length) return [];
    return lift.history.map((point) => {
      const t = toTime(point.date);
      const weighIn = [...weightRows].reverse().find((row) => row.t <= t) || weightRows[0];
      return { t, ratio: Math.round((point.value / weighIn.weight) * 100) / 100 };
    });
  }, [lift, weightRows]);

  const xDomain = useMemo(() => {
    const times = [...weightRows, ...ratioRows].map((row) => row.t);
    return times.length ? [Math.min(...times), Math.max(...times)] : ["dataMin", "dataMax"];
  }, [weightRows, ratioRows]);

  return (
    <ChartCard
      title="Bodyweight & relative strength"
      description={`Top: your weigh-ins. Bottom: your ${lift?.exerciseName || "lift"} estimated max divided by your bodyweight. 1.5x means you can lift one and a half times your bodyweight. It rises when you get stronger or leaner.`}
      empty={!weightRows.length}
      emptyMessage="Add your bodyweight in your profile or on the weekly check-in to see this chart."
      table={{
        columns: [
          { key: "date", label: "Date" },
          { key: "weight", label: `Bodyweight (${unit})` },
          { key: "ratio", label: "Strength / bodyweight" }
        ],
        rows: [...weightRows.map((row) => ({ t: row.t, weight: formatNumber(row.weight) })), ...ratioRows.map((row) => ({ t: row.t, ratio: `${row.ratio}x` }))]
          .sort((a, b) => a.t - b.t)
          .map((row) => ({ ...row, date: formatLongDate(row.t) }))
      }}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Bodyweight ({unit})</p>
      <div className="h-40">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={weightRows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis {...axisProps} dataKey="t" domain={xDomain} hide scale="time" type="number" />
            <YAxis {...axisProps} domain={paddedDomain(weightRows.map((row) => row.weight), 1)} width={48} />
            <Tooltip {...tooltipProps} formatter={(value) => [`${formatNumber(value)} ${unit}`, "Bodyweight"]} labelFormatter={formatLongDate} />
            <Line dataKey="weight" dot={{ r: 3, strokeWidth: 0, fill: BODYWEIGHT_COLOR }} isAnimationActive={false} stroke={BODYWEIGHT_COLOR} strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">{lift?.exerciseName || "Lift"} ÷ bodyweight</p>
      {ratioRows.length ? (
        <div className="h-40">
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={ratioRows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis {...axisProps} dataKey="t" domain={xDomain} minTickGap={32} scale="time" tickFormatter={formatShortDate} type="number" />
              <YAxis {...axisProps} domain={paddedDomain(ratioRows.map((row) => row.ratio), 0.05)} tickFormatter={(value) => `${value}x`} width={48} />
              <Tooltip {...tooltipProps} formatter={(value) => [`${value}x bodyweight`, "Relative strength"]} labelFormatter={formatLongDate} />
              <Line dataKey="ratio" dot={{ r: 3, strokeWidth: 0, fill: RATIO_COLOR }} isAnimationActive={false} stroke={RATIO_COLOR} strokeWidth={2} type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-slate-400">Pick a lift in the strength chart above to see it here.</p>
      )}
    </ChartCard>
  );
};

export default BodyweightChart;
