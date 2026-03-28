import { Platform } from 'react-native';
import { API_URL, FALLBACK_URLS } from '../config';

export const testConnection = async () => {
    console.log('Testing API connection...');
    console.log('Primary URL:', API_URL);
    
    const testUrls = [API_URL, ...FALLBACK_URLS];
    
    for (let i = 0; i < testUrls.length; i++) {
        const url = testUrls[i];
        try {
            console.log(`Testing URL ${i + 1}/${testUrls.length}: ${url}`);
            
            const response = await fetch(`${url}/users`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 5000,
            });
            
            if (response.ok) {
                console.log(`✅ Success! Connected to: ${url}`);
                return { success: true, url, data: await response.json() };
            } else {
                console.log(`❌ Failed with status: ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error connecting to ${url}:`, error.message);
        }
    }
    
    console.log('❌ All connection attempts failed');
    return { success: false, error: 'All URLs failed' };
};

export const logDeviceInfo = () => {
    console.log('=== Device Info ===');
    console.log('Platform:', Platform.OS);
    console.log('API URL:', API_URL);
    console.log('Fallback URLs:', FALLBACK_URLS);
    console.log('==================');
};
