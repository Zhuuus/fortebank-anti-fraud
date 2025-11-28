'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, DollarSign, FileText } from 'lucide-react';
import type { Summary } from '@/lib/types';

interface Props {
  summary: Summary;
}

export function SummaryCards({ summary }: Props) {
  const flaggedPercentage = parseFloat(summary.flagged_percentage || '0');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        icon={<FileText className="w-6 h-6" />}
        title="Total Transactions"
        value={summary.total.toLocaleString()}
        iconColor="text-blue-600 bg-blue-100 dark:bg-blue-900"
      />
      
      <Card
        icon={<AlertTriangle className="w-6 h-6" />}
        title="Flagged Transactions"
        value={summary.flagged_by_threshold.toLocaleString()}
        iconColor="text-red-600 bg-red-100 dark:bg-red-900"
      />
      
      <Card
        icon={<TrendingUp className="w-6 h-6" />}
        title="Flagged Percentage"
        value={`${flaggedPercentage.toFixed(2)}%`}
        iconColor="text-orange-600 bg-orange-100 dark:bg-orange-900"
      />
      
      <Card
        icon={<DollarSign className="w-6 h-6" />}
        title="Current Threshold"
        value={summary.threshold.toFixed(2)}
        iconColor="text-green-600 bg-green-100 dark:bg-green-900"
      />
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  iconColor: string;
}

function Card({ icon, title, value, iconColor }: CardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${iconColor}`}>{icon}</div>
      </div>
    </div>
  );
}
