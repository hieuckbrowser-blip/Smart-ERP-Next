'use client';

import { useTranslation } from '@smart-erp/i18n';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';

export default function PayrollPage() {
  const { t } = useTranslation('common');
  const { showToast } = useToast();

  const columns = [
    { key: 'employeeName', label: t('hr.payroll.employee') },
    { key: 'month', label: t('forecast.month') },
    { key: 'year', label: 'Year' },
    { key: 'baseSalary', label: t('hr.payroll.baseSalary') },
    { key: 'allowances', label: t('hr.payroll.allowances') },
    { key: 'deductions', label: t('hr.payroll.deductions') },
    { key: 'netSalary', label: t('hr.payroll.netSalary') },
  ];

  return (
    <AuthGuard>
      <div className="space-y-6">
        <PageHeader
          title={t('hr.payroll.title')}
          description="Process and view payroll"
          actions={
            <Button onClick={() => showToast('info', t('hr.payroll.processing'))}>
              {t('hr.payroll.processing')}
            </Button>
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