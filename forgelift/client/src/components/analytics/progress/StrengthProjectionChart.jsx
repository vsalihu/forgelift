import { useEffect, useMemo, useState } from "react";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartCard from "./ChartCard.jsx";
import { ACCENT, GRID, INK, axisProps, tooltipProps } from "./chartTheme.js";
import { describeEta, formatLongDate, formatNumber, formatShortDate, formatSigned, toTime } from "./format.js";

const StrengthProjectionChart = ({ lifts, selectedLiftName, onSelectLift, unit, onSaveGoal, onRemoveGoal, goalBusy, goalError }) => {
  const lift = lifts.find((item) => item.exerciseName === selectedLiftName) || lifts[0];
  const [goalInput, setGoalInput] = useState("");

  useEffect(() => {
    setGoalInput(lift?.goal?.target ? String(lift.goal.target) : "");
  }, [lift?.exerciseName, lift?.goal?.target]);

  const rows = useMemo(() => {
    if (!lift) return [];
    const history = lift.history.map((point) => ({ t: toTime(point.date), actual: point.value }));
    const projection = (lift.projection?.points || []).map((point) => ({
      t: toTime(point.date),
      expected: point.expected,
      range: [point.low, point.high]
    }));
    return [...history, ...projection].sort((a, b) => a.t - b.t);
  }, [lift]);

  const domain = useMemo(() => {
    const values = rows.flatMap((row) => [row.actual, ...(row.range || [])]).filter((value) => value !== undefined);
    if (lift?.goal?.target) values.push(lift.goal.target);
    if (!values.length) return ["auto", "auto"];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = Math.max(2, (max - min) * 0.08);
    return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
  }, [rows, lift]);

  if (!lifts.length) {
    return (
      <ChartCard
        title="Strength per lift"
        empty
        emptyMessage="Log the same lift at least 3 times to see its strength trend and where it's heading."
      />
    );
  }

  const projectionEnd = lift.projection?.points?.[lift.projection.points.length - 1];
  const submitGoal = (event) => {
    event.preventDefault();
    const target = Number(goalInput);
    if (target > 0) onSaveGoal(lift.exerciseName, target);
  };

  return (
    <ChartCard
      title="Strength per lift"
      description="Your estimated 1-rep max: the most you could lift once, worked out from your sets. The dotted line is where your current trend is heading, and the shaded area is the likely range."
      action={
        <select
          aria-label="Choose a lift"
          className="min-h-9 rounded-md border border-white/10 bg-black/40 px-3 text-sm font-semibold text-white"
          value={lift.exerciseName}
          onChange={(event) => onSelectLift(event.target.value)}
        >
          {lifts.map((item) => (
            <option key={item.exerciseName} value={item.exerciseName}>
              {item.exerciseName}
            </option>
          ))}
        </select>
      }
      table={{
        columns: [
          { key: "date", label: "Date" },
          { key: "actual", label: `Estimated max (${unit})` },
          { key: "expected", label: `Projected (${unit})` },
          { key: "range", label: "Likely range" }
        ],
        rows: rows.map((row) => ({
          date: formatLongDate(row.t),
          actual: row.actual !== undefined ? formatNumber(row.actual) : "",
          expected: row.expected !== undefined ? formatNumber(row.expected) : "",
          range: row.range ? `${formatNumber(row.range[0])} - ${formatNumber(row.range[1])}` : ""
        }))
      }}
      footer={
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-1 text-sm leading-6 text-slate-300">
            <p>
              Best so far: <span className="font-bold text-white">{formatNumber(lift.best)} {unit}</span>
              {lift.projection ? (
                <>
                  {" "}· trend <span className="font-bold text-white">{formatSigned(lift.projection.weeklyGain, ` ${unit}`)}</span> per week
                </>
              ) : null}
            </p>
            {projectionEnd ? (
              <p>
                In 12 weeks you&apos;re likely around{" "}
                <span className="font-bold text-white">
                  {formatNumber(projectionEnd.expected, 0)} {unit}
                </span>{" "}
                ({formatNumber(projectionEnd.low, 0)}-{formatNumber(projectionEnd.high, 0)}). Gains slow down as you get stronger, so
                the line curves.
              </p>
            ) : (
              <p className="text-slate-400">Log this lift a few more times over 3+ weeks to unlock its projection.</p>
            )}
            {lift.goal ? (
              <p>
                Goal <span className="font-bold text-white">{formatNumber(lift.goal.target)} {unit}</span>:{" "}
                {describeEta(lift.goal.eta, { unit: ` ${unit}` })}
              </p>
            ) : null}
          </div>
          <form className="flex flex-wrap items-end gap-2" onSubmit={submitGoal}>
            <label className="text-xs font-semibold text-slate-400">
              Goal ({unit})
              <input
                className="mt-1 block min-h-10 w-28 rounded-md border border-white/10 bg-black/40 px-3 text-sm text-white"
                inputMode="decimal"
                min="1"
                step="0.5"
                type="number"
                value={goalInput}
                onChange={(event) => setGoalInput(event.target.value)}
              />
            </label>
            <button
              className="min-h-10 rounded-full bg-forge-ember px-4 text-sm font-bold text-[#160a02] transition hover:bg-orange-400 disabled:opacity-50"
              disabled={goalBusy || !Number(goalInput)}
              type="submit"
            >
              {lift.goal ? "Update goal" : "Set goal"}
            </button>
            {lift.goal ? (
              <button
                className="min-h-10 rounded-md border border-white/10 px-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
                disabled={goalBusy}
                type="button"
                onClick={() => onRemoveGoal(lift.exerciseName)}
              >
                Remove
              </button>
            ) : null}
            {goalError ? <p className="w-full text-xs text-red-300">{goalError}</p> : null}
          </form>
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis {...axisProps} dataKey="t" domain={["dataMin", "dataMax"]} minTickGap={32} scale="time" tickFormatter={formatShortDate} type="number" />
            <YAxis {...axisProps} domain={domain} width={48} />
            <Tooltip
              {...tooltipProps}
              formatter={(value, name) => {
                if (name === "range") return [`${formatNumber(value[0])} - ${formatNumber(value[1])} ${unit}`, "Likely range"];
                return [`${formatNumber(value)} ${unit}`, name === "actual" ? "Estimated max" : "Projected"];
              }}
              labelFormatter={formatLongDate}
            />
            {lift.goal ? (
              <ReferenceLine
                ifOverflow="extendDomain"
                label={{ value: `Goal ${formatNumber(lift.goal.target)} ${unit}`, fill: INK, fontSize: 12, position: "insideTopLeft" }}
                stroke="rgba(255, 255, 255, 0.55)"
                strokeDasharray="4 4"
                y={lift.goal.target}
              />
            ) : null}
            <Area activeDot={false} dataKey="range" fill={ACCENT} fillOpacity={0.14} isAnimationActive={false} stroke="none" type="monotone" />
            <Line connectNulls dataKey="actual" dot={{ r: 3, strokeWidth: 0, fill: ACCENT }} isAnimationActive={false} stroke={ACCENT} strokeWidth={2} type="monotone" />
            <Line connectNulls dataKey="expected" dot={false} isAnimationActive={false} stroke={ACCENT} strokeDasharray="5 5" strokeWidth={2} type="monotone" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
};

export default StrengthProjectionChart;
