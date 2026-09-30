import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { ACCENT, AXIS, GOOD, GRID, axisProps, tooltipProps } from "./chartTheme.js";
import { formatLongDate, formatNumber, formatShortDate, toTime } from "./format.js";

const SYNC_ID = "fatigue-vs-progress";

const FatigueProgressChart = ({ weeks = [] }) => {
  const rows = weeks.map((week) => ({ t: toTime(week.weekStart), loadRatio: week.loadRatio, strengthIndex: week.strengthIndex }));
  const hasData = rows.some((row) => row.loadRatio !== null || row.strengthIndex !== null);
  const ratioMax = Math.max(2, ...rows.map((row) => row.loadRatio || 0));
  const strengthValues = rows.map((row) => row.strengthIndex).filter((value) => value !== null);
  const strengthDomain = strengthValues.length
    ? [Math.floor(Math.min(95, ...strengthValues)), Math.ceil(Math.max(105, ...strengthValues))]
    : [90, 110];

  return (
    <ChartCard
      title="Fatigue vs progress"
      description="Top: how hard each week was compared with your normal weeks (1.0 = normal). Bottom: how much stronger you are than when you started (100 = starting strength). Hard weeks should be followed by the bottom line going up."
      empty={!hasData}
      emptyMessage="Needs about 3 weeks of logged training."
      table={{
        columns: [
          { key: "week", label: "Week of" },
          { key: "loadRatio", label: "Load vs normal" },
          { key: "strengthIndex", label: "Strength (start = 100)" }
        ],
        rows: rows.map((row) => ({
          week: formatLongDate(row.t),
          loadRatio: row.loadRatio === null ? "" : `${formatNumber(row.loadRatio)}x`,
          strengthIndex: row.strengthIndex === null ? "" : formatNumber(row.strengthIndex)
        }))
      }}
    >
      <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Training load vs your normal</p>
      <div className="h-44">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} syncId={SYNC_ID}>
            <ReferenceArea
              fill={GOOD}
              fillOpacity={0.1}
              label={{ value: "Safe zone", position: "insideTopRight", fill: AXIS, fontSize: 11 }}
              y1={0.8}
              y2={1.3}
            />
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis {...axisProps} dataKey="t" domain={["dataMin", "dataMax"]} hide scale="time" type="number" />
            <YAxis {...axisProps} domain={[0, Math.ceil(ratioMax * 2) / 2]} tickFormatter={(value) => `${value}x`} width={48} />
            <Tooltip {...tooltipProps} formatter={(value) => [`${formatNumber(value)}x your normal week`, "Load"]} labelFormatter={(value) => `Week of ${formatLongDate(value)}`} />
            <Line connectNulls dataKey="loadRatio" dot={{ r: 3, strokeWidth: 0, fill: ACCENT }} isAnimationActive={false} stroke={ACCENT} strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Strength vs when you started</p>
      <div className="h-44">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }} syncId={SYNC_ID}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <ReferenceLine label={{ value: "Start", position: "insideBottomRight", fill: AXIS, fontSize: 11 }} stroke="rgba(255, 255, 255, 0.35)" y={100} />
            <XAxis {...axisProps} dataKey="t" domain={["dataMin", "dataMax"]} minTickGap={32} scale="time" tickFormatter={formatShortDate} type="number" />
            <YAxis {...axisProps} domain={strengthDomain} width={48} />
            <Tooltip {...tooltipProps} formatter={(value) => [`${formatNumber(value)} (start = 100)`, "Strength"]} labelFormatter={(value) => `Week of ${formatLongDate(value)}`} />
            <Line connectNulls dataKey="strengthIndex" dot={{ r: 3, strokeWidth: 0, fill: "#3987e5" }} isAnimationActive={false} stroke="#3987e5" strokeWidth={2} type="monotone" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default FatigueProgressChart;
