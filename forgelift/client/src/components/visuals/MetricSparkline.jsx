import { Line, LineChart, ResponsiveContainer } from "recharts";

const MetricSparkline = ({ data = [], dataKey = "value", variant = "rank", className = "" }) => {
  const stroke = variant === "success" ? "#34d399" : variant === "danger" ? "#f87171" : variant === "info" ? "#38bdf8" : "#f97316";

  if (!data.length) return null;

  return (
    <div className={`h-12 w-full ${className}`}>
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data}>
          <Line dataKey={dataKey} dot={false} stroke={stroke} strokeLinecap="round" strokeWidth={2} type="monotone" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricSparkline;
