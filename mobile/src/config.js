import Constants from 'expo-constants';

const debuggerHost = Constants.expoConfig?.hostUri;
const localIP = debuggerHost ? debuggerHost.split(':')[0] : "localhost"; 

// Try multiple connection options for better reliability
export const BASE_IP = localIP;
export const API_URL = `http://${BASE_IP}:3001/api`;
export const SOCKET_URL = `http://${BASE_IP}:3001`;

// Fallback URLs for different environments
export const FALLBACK_URLS = [
    'http://localhost:3001/api',
    'http://127.0.0.1:3001/api',
    'http://192.168.1.100:3001/api', // Common local network IP
    'http://192.168.0.100:3001/api', // Another common IP
    'http://10.0.0.100:3001/api',   // Alternative network
    'http://192.168.254.121:3001/api', // Your current detected IP
];

export const GOOGLE_CLIENT_ID = "309516516518-rq3rla7m3s5v1hqpif7pdpchm4slqu22.apps.googleusercontent.com";
