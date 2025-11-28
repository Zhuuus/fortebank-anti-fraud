'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { HourlyData } from '@/lib/types';

interface Props {
  data: HourlyData[];
}

export function HourlyChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Transactions by Hour
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="hour"
            label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis label={{ value: 'Count', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
            }}
          />
          <Legend />
          <Bar dataKey="count" fill="#3b82f6" name="Total" />
          <Bar dataKey="flagged" fill="#ef4444" name="Flagged" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
