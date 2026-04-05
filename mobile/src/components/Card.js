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
              backgroundColor: isDark ? 'rgba(12, 20, 32, 0.62)' : 'rgba(255, 255, 255, 0.78)',
              backdropFilter: 'blur(24px)',
          }
        : {};

    const androidStyle = isAndroid
        ? {
              backgroundColor: isDark ? 'rgba(12, 20, 32, 0.92)' : 'rgba(246, 251, 255, 0.92)',
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
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(20, 32, 51, 0.08)',
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
        shadowColor: 'rgba(122, 166, 255, 0.25)',
    },
    shadowDark: {
        ...theme.shadows.medium,
        shadowColor: '#06101a',
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
