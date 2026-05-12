
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';

const LAST_SYNC_KEY = 'last_sync_timestamp';

class SyncService {
  async sync() {
    try {
      // Perform sync logic (existing)
      // After successful sync:
      const timestamp = Date.now();
      await AsyncStorage.setItem(LAST_SYNC_KEY, timestamp.toString());
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }

  async getLastSyncTime(): Promise<number | null> {
    const val = await AsyncStorage.getItem(LAST_SYNC_KEY);
    return val ? parseInt(val, 10) : null;
  }
}

export const syncService = new SyncService();
