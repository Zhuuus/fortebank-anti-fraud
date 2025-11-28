'use client';

import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { AlertCircle, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { useFraudStore } from '@/lib/store';

interface Props {
  transactions: Transaction[];
}

export function TransactionsTable({ transactions }: Props) {
  const { submitFeedback, threshold } = useFraudStore();
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
  }>({ isOpen: false, transaction: null });

  const filteredTransactions = useMemo(() => {
    if (filter === 'flagged') {
      return transactions.filter((t) => t.fraud_score >= threshold);
    }
    return transactions;
  }, [transactions, filter, threshold]);

  const handleFeedback = async (docno: string, label: string) => {
    try {
      await submitFeedback(docno, label);
      setFeedbackModal({ isOpen: false, transaction: null });
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transactions ({filteredTransactions.length})
          </h3>

          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('flagged')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === 'flagged'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Flagged Only
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date/Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fraud Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTransactions.slice(0, 100).map((transaction) => (
              <tr
                key={transaction.docno}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {transaction.docno}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {transaction.client_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                  ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(transaction.transdatetime), 'MMM dd, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <ScoreBadge score={transaction.fraud_score} threshold={threshold} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge score={transaction.fraud_score} threshold={threshold} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleFeedback(transaction.docno, 'false_positive')}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full hover:bg-green-200 dark:bg-green-900 dark:text-green-300 dark:hover:bg-green-800 transition-colors"
                    title="Mark as False Positive"
                  >
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Safe
                  </button>
                  <button
                    onClick={() => handleFeedback(transaction.docno, 'confirmed_fraud')}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800 transition-colors"
                    title="Confirm as Fraud"
                  >
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Fraud
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredTransactions.length > 100 && (
        <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
          Showing first 100 of {filteredTransactions.length} transactions
        </div>
      )}
    </div>
  );
}

function ScoreBadge({ score, threshold }: { score: number; threshold: number }) {
  const isFlagged = score >= threshold;
  const percentage = (score * 100).toFixed(1);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isFlagged
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : score >= threshold * 0.7
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}
    >
      {percentage}%
    </span>
  );
}

function StatusBadge({ score, threshold }: { score: number; threshold: number }) {
  const isFlagged = score >= threshold;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isFlagged
          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}
    >
      {isFlagged ? (
        <>
          <AlertCircle className="w-3 h-3 mr-1" />
          Flagged
        </>
      ) : (
        <>
          <Eye className="w-3 h-3 mr-1" />
          Normal
        </>
      )}
    </span>
  );
}
