"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

export default function ScoreDonut({
  found,
  notFound,
  percent,
}: {
  found: number;
  notFound: number;
  percent: number;
}) {
  const data = [
    { name: "Gevonden", value: found },
    { name: "Niet gevonden", value: notFound },
  ];

  const COLORS = ["#30a81d", "#ff8400"]; // groen / rood

  return (
    <div className="w-64 h-64 relative">
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, idx) => (
              <Cell key={idx} fill={COLORS[idx]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-mono font-bold">{percent}%</span>
        <span className="text-gray-500 text-sm font-mono mt-1">compliant</span>
      </div>
    </div>
  );
}
