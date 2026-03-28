import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated } from 'react-native';
import { theme } from '../styles/theme';

export default function Input({
  label,
  isDark = false,
  error,
  style,
  containerStyle,
  value,
  placeholder,
  onFocus,
  onBlur,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  const hasValue = value != null && String(value).length > 0;
  const shouldFloat = isFocused || hasValue;

  useEffect(() => {
    Animated.spring(focusAnim, {
      toValue: shouldFloat ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
  }, [shouldFloat, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 58, 237, 0.15)',
      isDark ? theme.colors.accent : theme.colors.secondary,
    ],
  });

  const glowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.85],
  });

  const labelTop = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 6],
  });

  const labelSize = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [15, 10],
  });

  const labelColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(252, 248, 255, 0.35)' : 'rgba(30, 16, 51, 0.35)',
      isDark ? theme.colors.accent : theme.colors.secondary,
    ],
  });

  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.inputShell,
          {
            borderColor,
            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glowRing,
            {
              borderColor: isDark ? theme.colors.secondary : theme.colors.accent,
              opacity: glowOpacity,
            },
          ]}
        />
        {label ? (
          <Animated.Text
            style={[
              styles.floatingLabel,
              {
                top: labelTop,
                fontSize: labelSize,
                color: labelColor,
              },
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}
        <TextInput
          style={[
            styles.input,
            !!label && styles.inputWithLabel,
            { color: isDark ? theme.dark.textMain : theme.light.textMain },
            style,
          ]}
          value={value}
          placeholder={shouldFloat ? placeholder : label ? '' : placeholder}
          placeholderTextColor={isDark ? 'rgba(252, 248, 255, 0.28)' : 'rgba(30, 16, 51, 0.28)'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </Animated.View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  inputShell: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: theme.spacing.md,
    minHeight: 58,
    justifyContent: 'center',
    overflow: 'visible',
  },
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    margin: -2,
  },
  floatingLabel: {
    position: 'absolute',
    left: theme.spacing.md,
    fontFamily: theme.fontFamily.bodyLight,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: theme.fontFamily.bodyMedium,
    fontWeight: '500',
  },
  inputWithLabel: {
    paddingTop: 22,
    paddingBottom: 10,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    fontFamily: theme.fontFamily.bodySemi,
    marginTop: 6,
    marginLeft: 6,
  },
});
