import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export default function FadeInView({ children, style, delay = 0, offsetY = 20 }) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(offsetY)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 560,
                delay,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(translateY, {
                toValue: 0,
                delay,
                tension: 48,
                friction: 10,
                useNativeDriver: true,
            }),
        ]).start();
    }, [delay, offsetY]);

    return (
        <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>{children}</Animated.View>
    );
}
