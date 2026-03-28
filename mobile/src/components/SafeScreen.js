import React, { useContext } from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MoodContext } from '../context/MoodContext';
import { theme } from '../styles/theme';
import AmbientBackground from './AmbientBackground';

/**
 * Safe area insets + optional luxury ambient mesh (gradient blobs).
 */
export default function SafeScreen({ children, style, edges, ambient = true }) {
    const insets = useSafeAreaInsets();
    const mood = useContext(MoodContext);
    const isDark = mood?.isDarkTheme ?? false;

    const e = edges ?? ['top', 'left', 'right', 'bottom'];
    const topInset =
        e.includes('top') && Platform.OS === 'android'
            ? Math.max(insets.top, StatusBar.currentHeight ?? 0)
            : e.includes('top')
              ? insets.top
              : 0;

    const paddingStyle = {
        paddingTop: topInset,
        paddingBottom: e.includes('bottom') ? insets.bottom : 0,
        paddingLeft: e.includes('left') ? insets.left : 0,
        paddingRight: e.includes('right') ? insets.right : 0,
    };

    const baseBg = isDark ? theme.dark.background : theme.light.background;

    return (
        <View style={[styles.flex, paddingStyle, { backgroundColor: baseBg }, style]}>
            {ambient && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <AmbientBackground isDark={isDark} />
                </View>
            )}
            <View style={[styles.flex, styles.layer]} pointerEvents="box-none">
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1 },
    layer: { zIndex: 1 },
});
