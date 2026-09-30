import { Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { ACCENT, AXIS, MUTED_SERIES, tooltipProps } from "./chartTheme.js";
import { formatNumber } from "./format.js";

const MuscleBalanceRadar = ({ balance = [] }) => {
  const hasData = balance.some((item) => item.current || item.previous);
  const lowest = [...balance].filter((item) => item.current > 0 || item.previous > 0).sort((a, b) => a.current - b.current)[0];
  const highest = [...balance].sort((a, b) => b.current - a.current)[0];

  return (
    <ChartCard
      title="Muscle balance"
      description="Average weekly sets per muscle group over the last 4 weeks, compared with the 4 weeks before. A round shape means balanced training. A dent means that muscle is getting less work."
      empty={!hasData}
      emptyMessage="Needs a few weeks of logged training."
      table={{
        columns: [
          { key: "group", label: "Muscle group" },
          { key: "current", label: "Last 4 weeks (sets/week)" },
          { key: "previous", label: "4 weeks before" }
        ],
        rows: balance.map((item) => ({ group: item.group, current: formatNumber(item.current), previous: formatNumber(item.previous) }))
      }}
      footer={
        hasData && lowest && highest && highest.current > 0 ? (
          <p className="text-sm leading-6 text-slate-300">
            Most work: <span className="font-bold text-white">{highest.group}</span> ({formatNumber(highest.current)} sets/week). Least:{" "}
            <span className="font-bold text-white">{lowest.group}</span> ({formatNumber(lowest.current)} sets/week).
          </p>
        ) : null
      }
    >
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <RadarChart data={balance} margin={{ top: 8, right: 32, bottom: 8, left: 32 }} outerRadius="70%">
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
            <PolarAngleAxis dataKey="group" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
            <PolarRadiusAxis angle={64} axisLine={false} tick={{ fill: AXIS, fontSize: 10 }} tickCount={4} />
            <Tooltip {...tooltipProps} formatter={(value, name) => [`${formatNumber(value)} sets/week`, name]} />
            <Radar dataKey="previous" fill="none" isAnimationActive={false} name="4 weeks before" stroke={MUTED_SERIES} strokeWidth={2} />
            <Radar dataKey="current" fill={ACCENT} fillOpacity={0.25} isAnimationActive={false} name="Last 4 weeks" stroke={ACCENT} strokeWidth={2} />
            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default MuscleBalanceRadar;
