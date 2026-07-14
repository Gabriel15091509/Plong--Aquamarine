import React from "react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-white mb-1">
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name} :{" "}
            <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DEFAULT_LABELS = {
  adherents: "Adhérents",
  sorties: "Sorties",
  paiements: "Paiements",
};

const SERIES = [
  { key: "adherents", color: "#3b82f6" },
  { key: "sorties", color: "#10b981" },
  { key: "paiements", color: "#8b5cf6" },
];

const BarChart = ({ data, labels = DEFAULT_LABELS }) => {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {labels[s.key]}
            </span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar data={data} barGap={6}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="month"
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(148,163,184,0.1)" }}
          />
          {SERIES.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={labels[s.key]}
              fill={s.color}
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
              animationDuration={1200}
              animationEasing="ease-out"
            />
          ))}
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;
