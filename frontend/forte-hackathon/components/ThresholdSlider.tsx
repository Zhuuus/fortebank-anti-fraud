'use client';

import React, { useState, useEffect } from 'react';
import { Sliders } from 'lucide-react';
import { useFraudStore } from '@/lib/store';

export function ThresholdSlider() {
  const { threshold, updateThreshold, isLoading } = useFraudStore();
  const [localThreshold, setLocalThreshold] = useState(threshold);

  useEffect(() => {
    setLocalThreshold(threshold);
  }, [threshold]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalThreshold(parseFloat(e.target.value));
  };

  const handleMouseUp = async () => {
    if (localThreshold !== threshold) {
      try {
        await updateThreshold(localThreshold);
      } catch (error) {
        console.error('Failed to update threshold:', error);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <Sliders className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fraud Detection Threshold
        </h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Threshold Value
          </span>
          <span className="text-2xl font-bold text-blue-600">{localThreshold.toFixed(2)}</span>
        </div>

        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localThreshold}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={isLoading}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 
                     disabled:opacity-50 disabled:cursor-not-allowed
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4
                     [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-blue-600
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-moz-range-thumb]:w-4
                     [&::-moz-range-thumb]:h-4
                     [&::-moz-range-thumb]:bg-blue-600
                     [&::-moz-range-thumb]:rounded-full
                     [&::-moz-range-thumb]:border-0
                     [&::-moz-range-thumb]:cursor-pointer"
        />

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>0.00 (Low)</span>
          <span>0.50 (Medium)</span>
          <span>1.00 (High)</span>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Transactions with fraud score above this threshold will be flagged as suspicious.
        </p>
      </div>
    </div>
  );
}
