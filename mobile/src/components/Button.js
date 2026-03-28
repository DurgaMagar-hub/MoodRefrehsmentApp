import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, ActivityIndicator, StyleSheet, Pressable, View, Text, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';

export default function Button({
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  fullRounded = false,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const breathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (disabled || isLoading) return;
    if (variant === 'outline' || variant === 'ghost') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.03,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [variant, disabled, isLoading, breathe]);

  const handlePressIn = () => {
    if (disabled || isLoading) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 0.92, duration: 90, useNativeDriver: true }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || isLoading) return;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  };

  const gradientColors =
    variant === 'primary'
      ? theme.gradients.buttonPrimary
      : variant === 'secondary'
        ? theme.gradients.buttonSecondary
        : variant === 'danger'
          ? theme.gradients.buttonDanger
          : null;

  const glowColor =
    variant === 'primary'
      ? theme.colors.secondaryGlow
      : variant === 'secondary'
        ? theme.colors.accentGlow
        : variant === 'danger'
          ? 'rgba(251, 113, 133, 0.45)'
          : 'transparent';

  const border =
    variant === 'outline'
      ? { borderWidth: 1.5, borderColor: theme.colors.secondary }
      : variant === 'ghost'
        ? { borderWidth: 0 }
        : {};

  const paddingVal =
    size === 'small'
      ? { paddingVertical: 11, paddingHorizontal: 22 }
      : size === 'large'
        ? { paddingVertical: 18, paddingHorizontal: 38 }
        : { paddingVertical: 15, paddingHorizontal: 30 };

  const fontSize = size === 'small' ? 13 : size === 'large' ? 17 : 15;

  const radius = fullRounded ? theme.borderRadius.full : theme.borderRadius.md;

  const contentColor =
    variant === 'outline' || variant === 'ghost' ? theme.colors.secondary : '#ffffff';

  const pulseScale = useMemo(() => {
    if (variant === 'outline' || variant === 'ghost') return scaleAnim;
    return Animated.multiply(scaleAnim, breathe);
  }, [variant, scaleAnim, breathe]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || isLoading}
      style={[{ width: fullWidth ? '100%' : 'auto' }, style]}
      {...props}
    >
      <Animated.View
        style={[
          styles.outer,
          variant !== 'outline' && variant !== 'ghost' && glowColor !== 'transparent'
            ? { ...theme.shadows.glow(glowColor) }
            : theme.shadows.soft,
          {
            borderRadius: radius,
            opacity: disabled ? 0.38 : opacityAnim,
            transform: [{ scale: pulseScale }],
          },
          border,
        ]}
      >
        {gradientColors && variant !== 'outline' && variant !== 'ghost' ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { borderRadius: radius }, paddingVal]}
          >
            {isLoading ? (
              <ActivityIndicator color={contentColor} />
            ) : (
              <Text style={[styles.text, { color: contentColor, fontSize }]}>{children}</Text>
            )}
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.solidPad,
              paddingVal,
              {
                borderRadius: radius,
                backgroundColor: variant === 'ghost' || variant === 'outline' ? 'transparent' : theme.light.cardSolid,
                borderWidth: variant === 'ghost' || variant === 'outline' ? 0 : 1,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={contentColor} />
            ) : (
              <Text style={[styles.text, { color: contentColor, fontSize }]}>{children}</Text>
            )}
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    overflow: 'hidden',
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  solidPad: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderColor: 'rgba(124, 58, 237, 0.2)',
  },
  text: {
    fontFamily: theme.fontFamily.bodySemi,
    fontWeight: '600',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
