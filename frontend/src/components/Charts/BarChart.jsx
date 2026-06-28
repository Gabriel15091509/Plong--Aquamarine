import React from 'react';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsBar data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="adherents" fill="#3b82f6" />
        <Bar dataKey="sorties" fill="#10b981" />
        <Bar dataKey="paiements" fill="#8b5cf6" />
      </RechartsBar>
    </ResponsiveContainer>
  );
};

export default BarChart;