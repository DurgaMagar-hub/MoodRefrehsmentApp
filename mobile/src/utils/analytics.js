/**
 * Product analytics hook — pipe to Segment / Amplitude / PostHog later.
 */
import { useCallback } from 'react';

const ENABLED = __DEV__;

export function trackEvent(name, properties = {}) {
    if (ENABLED) {
        console.log(`[analytics] ${name}`, properties);
    }
}

export function useTrack() {
    return useCallback((name, properties) => trackEvent(name, properties), []);
}
