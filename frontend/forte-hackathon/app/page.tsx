'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';
import { SummaryCards } from '@/components/SummaryCards';
import { ThresholdSlider } from '@/components/ThresholdSlider';
import { TransactionsTable } from '@/components/TransactionsTable';
import { HourlyChart } from '@/components/charts/HourlyChart';
import { WeekdayChart } from '@/components/charts/WeekdayChart';
import { AmountRangeChart } from '@/components/charts/AmountRangeChart';
import { useFraudStore } from '@/lib/store';

export default function Home() {
  const { transactions, summary, analytics } = useFraudStore();
  
  const hasData = transactions.length > 0 && summary && analytics;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fraud Detection System
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload transactions to analyze fraud patterns with ML
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasData ? (
          /* Upload Screen */
          <div className="flex flex-col items-center justify-center py-20">
            <FileUpload />
          </div>
        ) : (
          /* Dashboard Screen */
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Threshold Slider */}
            <ThresholdSlider />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HourlyChart data={analytics.by_hour} />
              <WeekdayChart data={analytics.by_weekday} />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <AmountRangeChart data={analytics.by_amount_range} />
            </div>

            {/* Transactions Table */}
            <TransactionsTable transactions={transactions} />

            {/* Back to Upload Button */}
            <div className="flex justify-center pt-6">
              <button
                onClick={() => useFraudStore.getState().reset()}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Upload New File
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Made by Gauss Lab Team • Forte Hackathon 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
