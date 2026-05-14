/**
 * Mobile forecast API client.
 * Exports typed helpers for forecast and recommendation endpoints.
 */
import { api } from './api';

export interface MonthlyDemand {
  month: string;
  demand: number;
}

export interface ForecastResponse {
  productId: string;
  data: MonthlyDemand[];
}

export interface RecommendationResponse {
  productId: string;
  suggestedReorder: number;
}

export const forecastApi = {
  /** Fetch monthly demand forecast for a product. */
  getMonthlyDemand: (productId: string) =>
    api.get<ForecastResponse>(`/forecast/product/${productId}`),

  /** Fetch AI-driven reorder suggestion for a product given current stock. */
  getRecommendation: (productId: string, currentStock: number) =>
    api.get<RecommendationResponse>(
      `/inventory-recommendation/suggest?productId=${encodeURIComponent(productId)}&stock=${currentStock}`
    ),
};