import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Optional: set in mobile/.env as EXPO_PUBLIC_DEV_API_HOST=192.168.x.x (your PC on LAN) then restart Metro.
// With USB: adb reverse tcp:3001 tcp:3001 and EXPO_PUBLIC_DEV_API_HOST=127.0.0.1
const ENV_DEV_HOST = process.env.EXPO_PUBLIC_DEV_API_HOST?.trim();

function isTunnelMetroHost(host) {
    if (!host) return false;
    const h = host.toLowerCase();
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return false;
    if (h === 'localhost' || h === '127.0.0.1') return false;
    return (
        h.includes('exp.direct') ||
        h.includes('exp.host') ||
        h.includes('ngrok') ||
        h.includes('trycloudflare') ||
        h.includes('loca.lt') ||
        h.includes('.devtunnels.')
    );
}

function resolveDevHost() {
    // Android emulator: localhost/127.0.0.1 is the emulator itself, not your PC.
    if (Platform.OS === 'android' && Constants.isDevice === false) {
        return '10.0.2.2';
    }
    // If running on a physical device and no ENV override set, prefer the provided LAN IP
    // before consulting Metro's hostUri which often points at localhost/127.0.0.1.
    if (Constants.isDevice) {
        return '10.24.0.249';
    }
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
        const host = hostUri.split(':')[0];
        // Metro --tunnel gives a cloud URL; your API on :3001 is still only on this machine.
        if (isTunnelMetroHost(host)) {
            if (!ENV_DEV_HOST) {
                console.warn(
                    '[MoodRefreshment] Metro tunnel does not reach your Node API (port 3001). ' +
                        'Add mobile/.env: EXPO_PUBLIC_DEV_API_HOST=<PC Wi‑Fi IP> (phone same network), ' +
                        "or USB: run adb reverse tcp:3001 tcp:3001 and set EXPO_PUBLIC_DEV_API_HOST=127.0.0.1. " +
                        'Restart Metro. Keep npm run server running on the PC.'
                );
            }
            // If the tunnel is active, Metro's hostUri doesn't route to your local Node API.
            // Prefer an explicit override (mobile/.env EXPO_PUBLIC_DEV_API_HOST) or the known LAN IP.
            return ENV_DEV_HOST || '10.24.0.249';
        }
        return host;
    }

    // If running on a physical device and no hostUri / ENV set, prefer the provided LAN IP.
    if (Constants.isDevice) {
        return '10.24.0.249';
    }

    return 'localhost';
}

// Try multiple connection options for better reliability
export const BASE_IP = ENV_DEV_HOST || resolveDevHost();
export const API_URL = `http://${BASE_IP}:3001/api`;
export const SOCKET_URL = `http://${BASE_IP}:3001`;

// Fallback URLs for different environments
export const FALLBACK_URLS = [
    'http://10.24.0.249:3001/api', // Your current LAN IP (preferred)
    'http://10.0.2.2:3001/api', // Android emulator → host machine
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
    'http://192.168.254.121:3001/api',
    'http://192.168.1.100:3001/api',
    'http://192.168.0.100:3001/api',
    'http://10.0.0.100:3001/api',
];

// Google Cloud → Credentials (same project):
// - Web client (…54jfou32…): use in GoogleSignin.configure({ webClientId }) and server verifyIdToken audience.
// - Android client (…374lijm8o92…): only in Cloud Console (package + SHA-1); do NOT pass as webClientId.
const EXTRA_WEB_ID = Constants.expoConfig?.extra?.googleClientId?.trim?.() || "";
const EXTRA_ANDROID_ID = Constants.expoConfig?.extra?.googleAndroidClientId?.trim?.() || EXTRA_WEB_ID;

export const GOOGLE_EXPO_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?.trim() || EXTRA_WEB_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || EXTRA_ANDROID_ID;
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || EXTRA_WEB_ID;