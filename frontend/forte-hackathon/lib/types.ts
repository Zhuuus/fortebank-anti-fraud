// API Types matching backend contract

export interface Transaction {
  docno: string;
  client_id: number;
  amount: number;
  transdatetime: string;
  direction?: string;
  merchant_category?: string;
  country?: string;
  fraud_score: number;
  [key: string]: any; // Additional fields from CSV
}

export interface Summary {
  total: number;
  flagged_by_threshold: number;
  threshold: number;
  flagged_percentage?: string;
}

export interface HourlyData {
  hour: number;
  count: number;
  flagged: number;
}

export interface WeekdayData {
  weekday: number;
  count: number;
  flagged: number;
}

export interface AmountRangeData {
  label: string;
  count: number;
  flagged: number;
}

export interface ScoreDistribution {
  '0.0-0.2': number;
  '0.2-0.4': number;
  '0.4-0.6': number;
  '0.6-0.8': number;
  '0.8-1.0': number;
}

export interface Analytics {
  by_hour: HourlyData[];
  by_weekday: WeekdayData[];
  by_amount_range: AmountRangeData[];
  score_distribution: ScoreDistribution;
}

export interface UploadResponse {
  success: boolean;
  summary: Summary;
  transactions: Transaction[];
  analytics: Analytics;
  invalid_transactions?: {
    count: number;
    examples: any[];
  };
}

export interface ThresholdResponse {
  success: boolean;
  summary: Summary;
  flagged_transactions: Transaction[];
  flagged_docnos: string[];
}

export interface FeedbackRequest {
  docno: string;
  label: 'false_positive' | 'true_positive' | 'confirmed_fraud' | 'needs_review';
  comment?: string;
}

export interface FeedbackResponse {
  success: boolean;
  feedback: {
    id: string;
    docno: string;
    label: string;
    comment: string;
    timestamp: string;
  };
  message: string;
}

export interface FeatureImportance {
  [feature: string]: number;
}

export interface FeatureImportanceResponse {
  success: boolean;
  feature_importance: FeatureImportance;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
}
