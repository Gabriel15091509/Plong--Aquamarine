import React from "react";
import {
  BarChart as RechartsBar,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Tooltip custom stylé
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(17, 24, 39, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: "10px 12px",
          color: "#fff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: 0, color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const BarChart = ({ data }) => {
  return (
    <div
      style={{
        width: "100%",
        height: 350,
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        padding: 16,
        borderRadius: 16,
        boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBar data={data} barGap={6}>
          <defs>
            {/* Gradients modernes */}
            <linearGradient id="blue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.6} />
            </linearGradient>

            <linearGradient id="green" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#047857" stopOpacity={0.6} />
            </linearGradient>

            <linearGradient id="purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.9} />
              <stop offset="95%" stopColor="#5b21b6" stopOpacity={0.6} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ color: "#fff" }} />

          {/* Animations intégrées */}
          <Bar
            dataKey="adherents"
            fill="url(#blue)"
            radius={[8, 8, 0, 0]}
            animationDuration={1200}
            animationEasing="ease-out"
          />

          <Bar
            dataKey="sorties"
            fill="url(#green)"
            radius={[8, 8, 0, 0]}
            animationDuration={1400}
            animationEasing="ease-out"
          />

          <Bar
            dataKey="paiements"
            fill="url(#purple)"
            radius={[8, 8, 0, 0]}
            animationDuration={1600}
            animationEasing="ease-out"
          />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;