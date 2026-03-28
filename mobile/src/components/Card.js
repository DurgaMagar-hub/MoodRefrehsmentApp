import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { theme } from '../styles/theme';

export default function Card({ children, isDark = false, style, noPadding = false, intensity, ...props }) {
    const isWeb = Platform.OS === 'web';
    const isIOS = Platform.OS === 'ios';
    const isAndroid = Platform.OS === 'android';

    const Container = isIOS ? BlurView : View;
    const defaultIntensity = isDark ? 38 : 62;

    const webStyle = isWeb
        ? {
              backgroundColor: isDark ? 'rgba(22, 12, 40, 0.55)' : 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(24px)',
          }
        : {};

    const androidStyle = isAndroid
        ? {
              backgroundColor: isDark ? 'rgba(32, 22, 52, 0.92)' : 'rgba(255, 250, 252, 0.92)',
          }
        : {};

    return (
        <View style={[styles.shadowWrapper, isDark ? styles.shadowDark : styles.shadowLight, style]}>
            <Container
                {...(isIOS ? { intensity: intensity ?? defaultIntensity, tint: isDark ? 'dark' : 'light' } : {})}
                style={[
                    styles.card,
                    !noPadding && styles.padded,
                    {
                        borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(168, 85, 247, 0.14)',
                    },
                    isWeb || isAndroid ? { ...webStyle, ...androidStyle } : {},
                ]}
                {...props}
            >
                {children}
            </Container>
        </View>
    );
}

const styles = StyleSheet.create({
    shadowWrapper: {
        marginBottom: theme.spacing.lg,
        borderRadius: theme.borderRadius.xl,
    },
    shadowLight: {
        ...theme.shadows.soft,
        shadowColor: '#7c3aed',
    },
    shadowDark: {
        ...theme.shadows.medium,
        shadowColor: '#0a0616',
    },
    card: {
        borderRadius: theme.borderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
    },
    padded: {
        padding: theme.spacing.xl,
    },
});
