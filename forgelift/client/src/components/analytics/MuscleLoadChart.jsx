import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#f97316", "#f59e0b", "#22c55e", "#38bdf8", "#a78bfa", "#f43f5e", "#14b8a6", "#eab308"];

const MuscleLoadChart = ({ data = [] }) => {
  const chartData = data.slice(0, 8).map((item) => ({ name: item.muscle, value: item.totalLoad }));

  return (
    <div className="h-72">
      <ResponsiveContainer height="100%" width="100%">
        <PieChart>
          <Pie data={chartData} dataKey="value" innerRadius={58} nameKey="name" outerRadius={100} paddingAngle={2}>
            {chartData.map((entry, index) => (
              <Cell fill={colors[index % colors.length]} key={entry.name} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MuscleLoadChart;
