'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AuthGuard from '@/components/layout/AuthGuard';
import { apiClient } from '@/lib/api-client';

interface ForecastItem {
  date: string;
  predictedDemand: number;
  lowerBound: number;
  upperBound: number;
}

interface ForecastData {
  productId: string | null;
  forecast: ForecastItem[];
  metrics: {
    mape: number;
    recommendedReorderQuantity: number;
    confidence: string;
  };
}

const formatNumber = (n: number) => n.toLocaleString('vi-VN');

export default function ForecastPage() {
  const { t } = useTranslation('common');
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/analytics/forecast/demand', { params: { days: 30 } })
      .then((res) => {
        setForecast(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(t('common.error'));
        setLoading(false);
      });
  }, [t]);

  return (
    <AuthGuard>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('analytics.forecast.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('analytics.forecast.subtitle')}
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <svg
              className="animate-spin w-6 h-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t('common.loading')}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {forecast && (
          <div className="space-y-4">
            {forecast.productId && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('analytics.forecast.productId')}
                </p>
                <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                  {forecast.productId}
                </p>
              </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                        {t('analytics.forecast.table.date')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        {t('analytics.forecast.table.predicted')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        {t('analytics.forecast.table.lower')}
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                        {t('analytics.forecast.table.upper')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {forecast.forecast.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          {new Date(item.date).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          {formatNumber(item.predictedDemand)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatNumber(item.lowerBound)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {formatNumber(item.upperBound)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('analytics.forecast.metrics.mape')}
                </p>
                <p className="text-xl font-bold text-blue-600">
                  {forecast.metrics.mape}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('analytics.forecast.metrics.reorder')}
                </p>
                <p className="text-xl font-bold text-green-600">
                  {formatNumber(forecast.metrics.recommendedReorderQuantity)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                  {t('analytics.forecast.metrics.confidence')}
                </p>
                <p className="text-xl font-bold text-purple-600 capitalize">
                  {forecast.metrics.confidence}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}