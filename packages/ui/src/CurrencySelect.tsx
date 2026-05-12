'use client';

import { useTranslation } from '@smart-erp/i18n';

const CURRENCIES = [
  { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
];

interface CurrencySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  required?: boolean;
}

export function CurrencySelect({ value, onChange, className = '', required = false }: CurrencySelectProps) {
  const { t } = useTranslation('common');

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      required={required}
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} - {c.name}
        </option>
      ))}
    </select>
  );
}
