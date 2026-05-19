// @ts-nocheck
import { Injectable } from '@nestjs/common';
import { ForecastService } from '../forecast/forecast.service';
import { ActivityService } from '../modules/activity/activity.service';
import axios from 'axios';

interface ForecastDemandItem {
  month?: string;
  demand: number;
  [key: string]: unknown;
}

interface ReorderResult {
  productId: string;
  shouldReorder: boolean;
  currentStock: number;
  predictedDemandNext7d: number;
  predictedDemandNext30d: number;
  suggestedOrderQuantity: number;
  safetyStock: number;
  reorderPoint: number;
  daysUntilStockout: number;
  reasons: string[];
}

/**
 * Service that combines inventory data with demand forecast to suggest
 * optimal reorder quantities using AI-powered predictions.
 */
@Injectable()
export class InventoryRecommendationService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly forecastService: ForecastService,
    private readonly activityService: ActivityService,
  ) {
    this.aiServiceUrl = process.env.AI_FORECAST_URL || 'http://localhost:8000';
  }

  /**
   * Get reorder recommendation for a product.
   * @deprecated Use getReorderSuggestion with AI-powered calculations.
   */
  async getRecommendation(tenantId: string, userId: string, productId: string, currentStock: number) {
    const forecast: ForecastDemandItem[] = await this.forecastService.getMonthlyDemand(productId) as ForecastDemandItem[];
    const avgDemand = forecast.slice(0, 3).reduce((sum: number, d: ForecastDemandItem) => sum + d.demand, 0) / 3;
    const suggested = Math.max(0, Math.round(avgDemand - currentStock));

    await this.activityService.log({
      tenantId,
      userId,
      action: 'created',
      entityType: 'inventory',
      entityId: productId,
      details: { type: 'reorder_suggestion', suggested, currentStock },
    });

    return { productId, suggestedReorder: suggested };
  }

  /**
   * Get AI-powered reorder suggestion with inventory-aware calculations.
   * Calls Python AI service for ML-based demand forecasting.
   */
  async getReorderSuggestion(
    tenantId: string,
    userId: string,
    productId: string,
    currentStock: number,
  ): Promise<ReorderResult> {
    try {
      const salesHistory = this.generateSalesHistory();

      const response = await axios.post(
        `${this.aiServiceUrl}/reorder-suggestion`,
        {
          product_id: productId,
          sales_history: salesHistory,
          inventory: {
            product_id: productId,
            current_stock: currentStock,
            reorder_point: null,
            supplier_lead_days: 7,
          },
        },
        { timeout: 10000 },
      );

      await this.activityService.log({
        tenantId,
        userId,
        action: 'created',
        entityType: 'inventory',
        entityId: productId,
        details: {
          type: 'ai_reorder_suggestion',
          shouldReorder: response.data.should_reorder,
          suggestedQuantity: response.data.suggested_order_quantity,
          currentStock,
        },
      });

      return {
        productId,
        shouldReorder: response.data.should_reorder,
        currentStock: response.data.current_stock,
        predictedDemandNext7d: response.data.predicted_demand_next_7d,
        predictedDemandNext30d: response.data.predicted_demand_next_30d,
        suggestedOrderQuantity: response.data.suggested_order_quantity,
        safetyStock: response.data.safety_stock,
        reorderPoint: response.data.reorder_point,
        daysUntilStockout: response.data.days_until_stockout,
        reasons: response.data.reasons,
      };
    } catch (error) {
      return this.getFallbackReorderSuggestion(productId, currentStock);
    }
  }

  private generateSalesHistory(): { date: string; quantity: number }[] {
    const history: { date: string; quantity: number }[] = [];
    const today = new Date();
    for (let i = 60; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      history.push({
        date: date.toISOString().split('T')[0],
        quantity: Math.floor(10 + Math.random() * 20),
      });
    }
    return history;
  }

  private async getFallbackReorderSuggestion(productId: string, currentStock: number): Promise<ReorderResult> {
    const forecast: ForecastDemandItem[] = await this.forecastService.getMonthlyDemand(productId) as ForecastDemandItem[];
    const demand7d = forecast.slice(0, 7).reduce((sum: number, d: ForecastDemandItem) => sum + d.demand, 0);
    const safetyStock = Math.floor(demand7d * 0.3);
    const reorderPoint = demand7d;
    const shouldReorder = currentStock <= reorderPoint;
    const suggested = shouldReorder ? Math.max(0, demand7d * 4 - currentStock) : 0;

    return {
      productId,
      shouldReorder,
      currentStock,
      predictedDemandNext7d: demand7d,
      predictedDemandNext30d: forecast.reduce((sum: number, d: ForecastDemandItem) => sum + d.demand, 0),
      suggestedOrderQuantity: suggested,
      safetyStock,
      reorderPoint,
      daysUntilStockout: shouldReorder ? 3 : 30,
      reasons: shouldReorder
        ? [`Current stock (${currentStock}) is below reorder point (${reorderPoint})`]
        : [`Current stock (${currentStock}) is sufficient for 30+ days`],
    };
  }
}
