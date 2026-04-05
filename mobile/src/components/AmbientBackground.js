import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

const { width: W, height: H } = Dimensions.get('window');

function Blob({ colors, size, initialX, initialY, durationX, durationY, delay = 0 }) {
    const driftX = useRef(new Animated.Value(0)).current;
    const driftY = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0.65)).current;

    useEffect(() => {
        const loopDrift = () =>
            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(driftX, {
                            toValue: 1,
                            duration: durationX,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(driftY, {
                            toValue: 1,
                            duration: durationY,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(driftX, {
                            toValue: 0,
                            duration: durationX,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                        Animated.timing(driftY, {
                            toValue: 0,
                            duration: durationY,
                            easing: Easing.inOut(Easing.sin),
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            );

        const loopPulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, {
                    toValue: 0.85,
                    duration: 4000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulse, {
                    toValue: 0.55,
                    duration: 5200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        );

        const t = setTimeout(() => {
            loopDrift().start();
            loopPulse.start();
        }, delay);
        return () => clearTimeout(t);
    }, []);

    const translateX = driftX.interpolate({
        inputRange: [0, 1],
        outputRange: [-28, 36],
    });
    const translateY = driftY.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 24],
    });

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.blobWrap,
                {
                    left: initialX,
                    top: initialY,
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    opacity: pulse,
                    transform: [{ translateX }, { translateY }],
                },
            ]}
        >
            <LinearGradient
                colors={colors}
                start={{ x: 0.1, y: 0.1 }}
                end={{ x: 0.9, y: 0.9 }}
                style={StyleSheet.absoluteFill}
            />
        </Animated.View>
    );
}

export default function AmbientBackground({ isDark }) {
    const canvas = isDark ? theme.gradients.darkCanvas : theme.gradients.lightCanvas;
    const blobA = isDark ? theme.gradients.darkBlobA : theme.gradients.lightBlobA;
    const blobB = isDark ? theme.gradients.darkBlobB : theme.gradients.lightBlobB;
    const blobC = isDark ? theme.gradients.darkBlobC : theme.gradients.lightBlobC;

    return (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <LinearGradient colors={canvas} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} />
            {!isDark && (
                <View style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}>
                    <LinearGradient
                        colors={['rgba(255,255,255,0.5)', 'transparent']}
                        style={{ flex: 1 }}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 0.45 }}
                    />
                </View>
            )}
            <Blob colors={blobA} size={W * 0.85} initialX={-W * 0.35} initialY={-H * 0.08} durationX={14000} durationY={18000} delay={0} />
            <Blob colors={blobB} size={W * 0.75} initialX={W * 0.35} initialY={H * 0.12} durationX={16000} durationY={12000} delay={400} />
            <Blob colors={blobC} size={W * 0.65} initialX={W * 0.05} initialY={H * 0.45} durationX={19000} durationY={15000} delay={200} />
            {isDark && (
                <View style={styles.stars} pointerEvents="none">
                    {[...Array(18)].map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.starDot,
                                {
                                    left: `${(i * 47 + 13) % 100}%`,
                                    top: `${(i * 29 + 7) % 85}%`,
                                    opacity: 0.15 + (i % 5) * 0.06,
                                },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    blobWrap: {
        position: 'absolute',
        overflow: 'hidden',
    },
    stars: {
        ...StyleSheet.absoluteFillObject,
    },
    starDot: {
        position: 'absolute',
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: '#e9f2ff',
    },
});
