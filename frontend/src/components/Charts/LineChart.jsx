import React from 'react';
import { LineChart as RechartsLine, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const LineChart = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RechartsLine data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" />
      </RechartsLine>
    </ResponsiveContainer>
  );
};

export default LineChart;