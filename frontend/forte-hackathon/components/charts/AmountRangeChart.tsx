'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AmountRangeData } from '@/lib/types';

interface Props {
  data: AmountRangeData[];
}

export function AmountRangeChart({ data }: Props) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
        Transactions by Amount Range
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="label" type="category" width={100} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
            }}
          />
          <Bar dataKey="count" fill="#3b82f6" name="Total" />
          <Bar dataKey="flagged" fill="#ef4444" name="Flagged" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
