import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { MUSCLE_COLORS, SURFACE, axisProps, barTooltipCursor, tooltipProps } from "./chartTheme.js";
import { formatLongDate, formatShortDate, toTime } from "./format.js";

const GROUPS = Object.keys(MUSCLE_COLORS);

const MuscleVolumeChart = ({ weeks = [] }) => {
  const rows = weeks.map((week) => ({ ...week, t: toTime(week.weekStart) }));
  const hasData = rows.some((row) => GROUPS.some((group) => row[group]));

  return (
    <ChartCard
      title="Weekly sets per muscle"
      description="How many working sets each muscle group got each week. Most people grow well on roughly 10-20 sets per muscle per week."
      empty={!hasData}
      emptyMessage="No sets logged in this period yet."
      table={{
        columns: [{ key: "week", label: "Week of" }, ...GROUPS.map((group) => ({ key: group, label: group }))],
        rows: rows.map((row) => ({ week: formatLongDate(row.t), ...Object.fromEntries(GROUPS.map((group) => [group, row[group] || 0])) }))
      }}
    >
      <div className="h-80">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
            <XAxis {...axisProps} dataKey="t" minTickGap={24} tickFormatter={formatShortDate} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip
              {...tooltipProps}
              cursor={barTooltipCursor}
              formatter={(value, name) => [`${value} sets`, name]}
              labelFormatter={(value) => `Week of ${formatLongDate(value)}`}
            />
            <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12, color: "#cbd5e1", paddingTop: 8 }} />
            {GROUPS.map((group, index) => (
              <Bar
                dataKey={group}
                fill={MUSCLE_COLORS[group]}
                isAnimationActive={false}
                key={group}
                radius={index === GROUPS.length - 1 ? [4, 4, 0, 0] : 0}
                stackId="sets"
                stroke={SURFACE}
                strokeWidth={1}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default MuscleVolumeChart;
