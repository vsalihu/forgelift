import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const StrengthTrendChart = ({ trend }) => (
  <div className="h-72">
    <ResponsiveContainer height="100%" width="100%">
      <LineChart data={trend?.data || []}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="label" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
        <Line dataKey="estimated1RM" dot={{ r: 3 }} stroke="#f97316" strokeWidth={3} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default StrengthTrendChart;
