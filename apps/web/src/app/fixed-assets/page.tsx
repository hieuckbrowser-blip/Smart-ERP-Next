'use client';

import { useTranslation } from '@smart-erp/i18n';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';

export default function FixedAssetsPage() {
  const { t } = useTranslation('common');

  const columns = [
    { key: 'code', label: t('fixedAssets.code') },
    { key: 'name', label: t('fixedAssets.name') },
    { key: 'category', label: t('fixedAssets.category') },
    { key: 'purchaseCost', label: t('fixedAssets.purchaseCost') },
    { key: 'accumulatedDepreciation', label: t('fixedAssets.accumulatedDepreciation') },
    { key: 'status', label: t('fixedAssets.status') },
  ];

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title={t('fixedAssets.title')}
          description={t('fixedAssets.asset')}
          actions={
            <Button>{t('fixedAssets.add')}</Button>
          }
        />
        <DataTable
          columns={columns}
          data={[]}
          loading={false}
          emptyMessage={t('common.noData')}
        />
      </div>
    </AuthGuard>
  );
}