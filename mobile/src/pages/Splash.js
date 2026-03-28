import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

export default function SplashScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(36)).current;
    const scaleAnim = useRef(new Animated.Value(0.88)).current;
    const haloPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1400,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1400,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic),
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 48,
                friction: 9,
                useNativeDriver: true,
            }),
        ]).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(haloPulse, {
                    toValue: 1.06,
                    duration: 2800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(haloPulse, {
                    toValue: 1,
                    duration: 2800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 3200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient colors={theme.gradients.splashDark} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.9, y: 1 }} />
            <LinearGradient
                colors={['rgba(168,85,247,0.35)', 'transparent', 'rgba(212,165,116,0.15)']}
                style={[StyleSheet.absoluteFill, { opacity: 0.9 }]}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
            />
            <View style={styles.starfield} pointerEvents="none">
                {[...Array(24)].map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.star,
                            {
                                left: `${(i * 41) % 100}%`,
                                top: `${(i * 17 + 5) % 88}%`,
                                opacity: 0.12 + (i % 6) * 0.05,
                            },
                        ]}
                    />
                ))}
            </View>

            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
                    },
                ]}
            >
                <Animated.View style={[styles.logoOrbit, { transform: [{ scale: haloPulse }] }]}>
                    <LinearGradient colors={theme.gradients.buttonPrimary} style={styles.logoGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    <View style={styles.logoInner}>
                        <Text style={styles.logoEmoji}>✨</Text>
                    </View>
                </Animated.View>
                <Text style={styles.logoText}>Aura</Text>
                <Text style={styles.subText}>Mood Refreshment</Text>
                <Text style={styles.tagline}>Nourish your inner light</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.version}>Premium wellness · 2026</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.dark.background,
    },
    starfield: {
        ...StyleSheet.absoluteFillObject,
    },
    star: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#fce7f3',
    },
    content: {
        alignItems: 'center',
    },
    logoOrbit: {
        width: 132,
        height: 132,
        borderRadius: 66,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 36,
        padding: 3,
        ...theme.shadows.glow(theme.colors.secondaryGlow),
    },
    logoGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 66,
    },
    logoInner: {
        width: 122,
        height: 122,
        borderRadius: 61,
        backgroundColor: 'rgba(6,2,20,0.88)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    logoEmoji: {
        fontSize: 52,
    },
    logoText: {
        ...theme.typography.mega,
        color: theme.dark.textMain,
        fontSize: 56,
    },
    subText: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        marginTop: 8,
        letterSpacing: 4,
    },
    tagline: {
        ...theme.typography.body,
        color: 'rgba(252,248,255,0.45)',
        marginTop: 20,
        fontFamily: theme.fontFamily.bodyLight,
    },
    footer: {
        position: 'absolute',
        bottom: 56,
    },
    version: {
        ...theme.typography.caption,
        color: 'rgba(252,248,255,0.28)',
        letterSpacing: 2,
    },
});
