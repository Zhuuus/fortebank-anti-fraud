import { create } from 'zustand';
import type { Transaction, Summary, Analytics } from './types';
import { apiClient } from './api-client';

interface FraudDetectionStore {
  // State
  transactions: Transaction[];
  summary: Summary | null;
  analytics: Analytics | null;
  threshold: number;
  isLoading: boolean;
  error: string | null;
  
  // Upload state
  uploadProgress: number;
  
  // Actions
  uploadFile: (file: File, threshold?: number) => Promise<void>;
  updateThreshold: (newThreshold: number) => Promise<void>;
  submitFeedback: (docno: string, label: string, comment?: string) => Promise<void>;
  reset: () => void;
}

const DEFAULT_THRESHOLD = 0.8;

export const useFraudStore = create<FraudDetectionStore>((set, get) => ({
  // Initial state
  transactions: [],
  summary: null,
  analytics: null,
  threshold: DEFAULT_THRESHOLD,
  isLoading: false,
  error: null,
  uploadProgress: 0,

  // Upload file action
  uploadFile: async (file: File, threshold = DEFAULT_THRESHOLD) => {
    set({ isLoading: true, error: null, uploadProgress: 0 });

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        set((state) => ({
          uploadProgress: Math.min(state.uploadProgress + 10, 90),
        }));
      }, 200);

      const response = await apiClient.uploadFile(file, threshold);

      clearInterval(progressInterval);

      if (response.success) {
        set({
          transactions: response.transactions,
          summary: response.summary,
          analytics: response.analytics,
          threshold: response.summary.threshold,
          isLoading: false,
          uploadProgress: 100,
          error: null,
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || error.message || 'Upload failed',
        uploadProgress: 0,
      });
      throw error;
    }
  },

  // Update threshold action
  updateThreshold: async (newThreshold: number) => {
    const { transactions } = get();

    if (transactions.length === 0) {
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await apiClient.applyThreshold(transactions, newThreshold);

      if (response.success) {
        set({
          summary: response.summary,
          threshold: newThreshold,
          isLoading: false,
          error: null,
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.message || error.message || 'Failed to update threshold',
      });
      throw error;
    }
  },

  // Submit feedback action
  submitFeedback: async (docno: string, label: string, comment?: string) => {
    try {
      await apiClient.submitFeedback({
        docno,
        label: label as any,
        comment,
      });

      // Optionally update transaction with feedback status
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.docno === docno ? { ...t, feedback: label } : t
        ),
      }));
    } catch (error: any) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      transactions: [],
      summary: null,
      analytics: null,
      threshold: DEFAULT_THRESHOLD,
      isLoading: false,
      error: null,
      uploadProgress: 0,
    });
  },
}));
