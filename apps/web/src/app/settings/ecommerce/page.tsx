'use client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Input, Button, Tabs, Tab, useToast } from '@smart-erp/ui';
import { apiClient } from '@/lib/api-client';

export default function EcommerceSettingsPage() {
  const { t } = useTranslation('common');
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('woocommerce');
  const [shopeeConfig, setShopeeConfig] = useState({ partnerId: '', partnerKey: '', shopId: '' });
  const [tiktokConfig, setTiktokConfig] = useState({ appKey: '', appSecret: '', shopId: '' });
  const [amazonConfig, setAmazonConfig] = useState({ clientId: '', clientSecret: '', refreshToken: '', sellerId: '', region: 'na' });

  const saveTikTok = async () => {
    try {
      await apiClient.post('/ecommerce/stores', { platform: 'tiktokshop', name: 'TikTok Shop', configJson: JSON.stringify(tiktokConfig) });
      toast.success(t('ecommerce.tiktokSaved'));
    } catch (err) {
      toast.error(t('common.error'));
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t('ecommerce.title')}</h1>
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tab value="woocommerce" label="WooCommerce" />
        <Tab value="shopify" label="Shopify" />
        <Tab value="shopee" label="Shopee" />
        <Tab value="tiktokshop" label="TikTok Shop" />
        <Tab value="amazon" label="Amazon" />
      </Tabs>

      {activeTab === 'tiktokshop' && (
        <Card className="mt-4 p-4">
          <div className="space-y-4">
            <Input label={t('ecommerce.tiktokAppKey')} value={tiktokConfig.appKey} onChange={e => setTiktokConfig({ ...tiktokConfig, appKey: e.target.value })} />
            <Input label={t('ecommerce.tiktokAppSecret')} type="password" value={tiktokConfig.appSecret} onChange={e => setTiktokConfig({ ...tiktokConfig, appSecret: e.target.value })} />
            <Input label={t('ecommerce.tiktokShopId')} value={tiktokConfig.shopId} onChange={e => setTiktokConfig({ ...tiktokConfig, shopId: e.target.value })} />
            <Button onClick={saveTikTok}>{t('actions.save')}</Button>
          </div>
        </Card>
      )}

      {activeTab === 'amazon' && (
        <Card className="mt-4 p-4">
          <div className="space-y-4">
            <Input label={t('ecommerce.amazonClientId')} value={amazonConfig.clientId} onChange={e => setAmazonConfig({ ...amazonConfig, clientId: e.target.value })} />
            <Input label={t('ecommerce.amazonClientSecret')} type="password" value={amazonConfig.clientSecret} onChange={e => setAmazonConfig({ ...amazonConfig, clientSecret: e.target.value })} />
            <Input label={t('ecommerce.amazonRefreshToken')} type="password" value={amazonConfig.refreshToken} onChange={e => setAmazonConfig({ ...amazonConfig, refreshToken: e.target.value })} />
            <Input label={t('ecommerce.amazonSellerId')} value={amazonConfig.sellerId} onChange={e => setAmazonConfig({ ...amazonConfig, sellerId: e.target.value })} />
            <Select label={t('ecommerce.amazonRegion')} value={amazonConfig.region} onChange={v => setAmazonConfig({ ...amazonConfig, region: v })} options={[
              { value: 'na', label: 'North America' },
              { value: 'eu', label: 'Europe' },
              { value: 'fe', label: 'Far East' },
            ]} />
            <Button onClick={async () => {
              await apiClient.post('/ecommerce/stores', { platform: 'amazon', name: 'Amazon Store', configJson: JSON.stringify(amazonConfig) });
              toast.success(t('ecommerce.amazonSaved'));
            }}>{t('actions.save')}</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
