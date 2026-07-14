import React from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981"];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2">
        <p className="text-xs font-semibold text-gray-800 dark:text-white">
          {data.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          Valeur : <span className="font-semibold">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const PieChart = ({ data }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <RechartsPie>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={65}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={1000}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#fff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsPie>
        </ResponsiveContainer>

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {total}
          </p>
          <p className="text-xs text-gray-400 dark:text-slate-500">Total</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PieChart;
