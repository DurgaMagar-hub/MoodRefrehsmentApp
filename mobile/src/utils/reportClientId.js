import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'chatReportClientKey_v1';

/**
 * Stable anonymous id for guests to submit/list chat reports (AsyncStorage).
 */
export async function getOrCreateReportClientKey() {
    try {
        let key = await AsyncStorage.getItem(STORAGE_KEY);
        if (key && key.length >= 8) return key;
        key = `r_${Date.now()}_${Math.random().toString(36).slice(2, 14)}`;
        await AsyncStorage.setItem(STORAGE_KEY, key);
        return key;
    } catch {
        return `r_fallback_${Date.now()}`;
    }
}
