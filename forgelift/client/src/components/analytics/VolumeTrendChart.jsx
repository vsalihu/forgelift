import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const VolumeTrendChart = ({ data = [] }) => (
  <div className="h-72">
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data}>
        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis dataKey="period" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip contentStyle={{ background: "#111827", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }} />
        <Bar dataKey="totalVolume" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default VolumeTrendChart;
