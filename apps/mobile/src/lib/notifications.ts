// @ts-nocheck
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useTranslation } from 'react-i18next';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerForPushNotifications(): Promise<string | null> {
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PROJECT_ID,
  });

  // Save token to server
  const saved = await savePushToken(token.data);
  return saved ? token.data : null;
}

async function savePushToken(token: string): Promise<boolean> {
  const tenantId = await SecureStore.getItemAsync('tenant_id');
  const userId = await SecureStore.getItemAsync('user_id');

  if (!tenantId || !userId) return false;

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notifications/register-device`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify({
        userId,
        pushToken: token,
        platform: 'mobile',
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to save push token:', error);
    return false;
  }
}

export async function scheduleLocalNotification(
  titleKey: string,
  bodyKey: string,
  data?: Record<string, unknown>,
  secondsFromNow = 0,
): Promise<string> {
  const { t } = useTranslation('common');

  return Notifications.scheduleNotificationAsync({
    content: {
      title: t(titleKey),
      body: t(bodyKey),
      data,
      sound: 'default',
    },
    trigger: secondsFromNow > 0 ? { seconds: secondsFromNow } : null,
  });
}

// Predefined notification helpers
export const NotificationHelpers = {
  async newApprovalRequest(documentType: string, amount: number) {
    return scheduleLocalNotification(
      'notifications.newApproval',
      'notifications.newApprovalBody',
      { type: 'approval', documentType, amount },
    );
  },

  async lowStockAlert(productName: string, currentStock: number) {
    return scheduleLocalNotification(
      'notifications.lowStock',
      'notifications.lowStockBody',
      { type: 'inventory', productName, currentStock },
    );
  },

  async orderReceived(orderCode: string) {
    return scheduleLocalNotification(
      'notifications.orderReceived',
      'notifications.orderReceivedBody',
      { type: 'order', orderCode },
    );
  },
};