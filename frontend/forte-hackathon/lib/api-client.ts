import axios, { AxiosInstance } from 'axios';
import type {
  UploadResponse,
  ThresholdResponse,
  FeedbackRequest,
  FeedbackResponse,
  FeatureImportanceResponse,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Увеличиваем таймаут, чтобы дождаться ответа от backend,
      // который теперь может ждать до 3 минут ответа от ML-сервиса
      timeout: 180000,
    });
  }

  /**
   * Upload CSV file for fraud detection analysis
   */
  async uploadFile(file: File, threshold: number = 0.8): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('threshold', threshold.toString());

    const response = await this.client.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Apply new threshold to existing transactions
   */
  async applyThreshold(
    transactions: any[],
    threshold: number
  ): Promise<ThresholdResponse> {
    const response = await this.client.post<ThresholdResponse>('/api/apply-threshold', {
      transactions,
      threshold,
    });

    return response.data;
  }

  /**
   * Submit feedback for a transaction
   */
  async submitFeedback(feedback: FeedbackRequest): Promise<FeedbackResponse> {
    const response = await this.client.post<FeedbackResponse>('/api/feedback', feedback);

    return response.data;
  }

  /**
   * Get feature importance from ML model
   */
  async getFeatureImportance(): Promise<FeatureImportanceResponse> {
    const response = await this.client.get<FeatureImportanceResponse>(
      '/api/feature-importance'
    );

    return response.data;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export default ApiClient;
