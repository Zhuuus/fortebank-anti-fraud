'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { WeekdayData } from '@/lib/types';

interface Props {
  data: WeekdayData[];
}

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekdayChart({ data }: Props) {
  const chartData = data.map((item) => ({
    ...item,
    dayName: WEEKDAY_NAMES[item.weekday],
  }));

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Transactions by Weekday
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="dayName" />
          <YAxis />
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
