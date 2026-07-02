import React from "react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Couleurs modernes
const COLORS = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b"];

// Tooltip custom stylé
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "10px 12px",
          borderRadius: 12,
          color: "#fff",
          boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>{data.name}</p>
        <p style={{ margin: 0, color: "#38bdf8" }}>Valeur: {data.value}</p>
      </div>
    );
  }
  return null;
};

const PieChart = ({ data }) => {
  return (
    <div
      style={{
        width: "100%",
        height: 350,
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        borderRadius: 16,
        padding: 16,
        boxShadow: "0 15px 35px rgba(0,0,0,0.4)",
        position: "relative",
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPie>
          {/* Glow effect (centre pro look) */}
          <defs>
            {COLORS.map((color, i) => (
              <linearGradient
                key={i}
                id={`grad${i}`}
                x1="0"
                y1="0"
                x2="1"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                <stop offset="100%" stopColor={color} stopOpacity={0.6} />
              </linearGradient>
            ))}
          </defs>

          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={55} // 🔥 effet donut moderne
            paddingAngle={3}
            dataKey="value"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#grad${index % COLORS.length})`}
                stroke="rgba(255,255,255,0.15)"
              />
            ))}
          </Pie>

          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              color: "#fff",
              fontSize: 12,
            }}
          />
        </RechartsPie>
      </ResponsiveContainer>

      {/* Centre label style (optionnel) */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "#fff",
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>Total</p>
      </div>
    </div>
  );
};

export default PieChart;
