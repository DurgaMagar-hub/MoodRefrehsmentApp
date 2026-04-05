import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { formatDeviceDate } from '../utils/deviceTime';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Custom component for staggered animation
const AnimatedJournalCard = ({ entry, index, isDark, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                delay: index * 100, // staggered delay
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 400,
                delay: index * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Card isDark={isDark} style={styles.journalCard} intensity={isDark ? 40 : 80}>
                    <Text style={[styles.watermark, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{entry.mood || "✨"}</Text>
                    
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeRow}>
                            <View style={[styles.dateBadge, { backgroundColor: isDark ? theme.colors.primaryDark : theme.colors.primary }]}>
                                <Text style={styles.dateText}>
                                    {(formatDeviceDate(entry.createdAt, { day: '2-digit', month: 'short' }) ||
                                        formatDeviceDate(Date.now(), { day: '2-digit', month: 'short' })
                                    ).toUpperCase()}
                                </Text>
                            </View>
                            <View style={[styles.moodBadge, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.border }]}>
                                <Text style={[styles.moodText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{entry.mood || "✨"}</Text>
                            </View>
                        </View>
                        <View style={[styles.iconWrapper, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary }]}>
                            <Feather name="chevron-right" size={18} color={isDark ? theme.dark.textMain : theme.light.textMain} />
                        </View>
                    </View>

                    {(() => {
                        let styleObj = null;
                        try {
                            styleObj = typeof entry.style === 'string' ? JSON.parse(entry.style) : entry.style;
                        } catch (_) {
                            styleObj = null;
                        }
                        const fontMap = {
                            body: theme.fontFamily.body,
                            bodyMedium: theme.fontFamily.bodyMedium,
                            display: theme.fontFamily.displayMedium,
                        };
                        const titleColor =
                            styleObj?.color && styleObj.color !== 'auto'
                                ? styleObj.color
                                : (isDark ? theme.dark.textMain : theme.light.textMain);
                        const titleFont = fontMap[styleObj?.font] || theme.fontFamily.bodyMedium;
                        return (
                            <Text
                                style={[
                                    styles.entryTitle,
                                    { color: titleColor, fontFamily: titleFont },
                                ]}
                            >
                                {entry.title}
                            </Text>
                        );
                    })()}
                    <Text 
                        numberOfLines={2} 
                        style={[styles.entryPreview, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}
                    >
                        {entry.content?.replace(/<[^>]*>?/gm, '') || "No content..."}
                    </Text>
                </Card>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function JournalScreen({ navigation }) {
    const { journalEntries, isDarkTheme } = useContext(MoodContext);
    const isDark = isDarkTheme;

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}>
                    <Feather name="chevron-left" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.header}>
                <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Your Journal</Text>
                <Text style={[styles.subtitle, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Capture your inner reflections.</Text>
            </View>

            {journalEntries.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📓</Text>
                    <Text style={[styles.emptyText, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>No entries yet. Start writing today!</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {journalEntries.map((entry, index) => (
                        <AnimatedJournalCard 
                            key={entry.id || index}
                            entry={entry}
                            index={index}
                            isDark={isDark}
                            onPress={() => navigation.navigate('JournalEntry', { id: entry.id })}
                        />
                    ))}
                </ScrollView>
            )}

            {/* Glowing Floating Action Button */}
            <TouchableOpacity 
                style={[styles.fab, { backgroundColor: theme.colors.primary, ...theme.shadows.glow(theme.colors.primaryGlow) }]} 
                onPress={() => navigation.navigate('JournalEntry')}
                activeOpacity={0.9}
            >
                <Feather name="plus" color="#fff" size={24} style={{ marginRight: 8 }} />
                <Text style={styles.fabText}>NEW REFLECTION</Text>
            </TouchableOpacity>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.soft,
    },
    header: {
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    title: {
        ...theme.typography.h1,
    },
    subtitle: {
        ...theme.typography.subtitle,
        marginTop: 4,
    },
    scroll: {
        padding: theme.spacing.lg,
        paddingBottom: 120, // space for fab
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: theme.spacing.md,
    },
    emptyText: {
        ...theme.typography.subtitle,
    },
    journalCard: {
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        overflow: 'hidden',
    },
    watermark: {
        position: 'absolute',
        right: -10,
        bottom: -20,
        fontSize: 90,
        opacity: 0.04,
        transform: [{ rotate: '-15deg' }],
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    badgeRow: {
        flexDirection: 'row',
        // removed gap for maximum native layout stability
    },
    dateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
        marginRight: 8, // fallback for gap
    },
    dateText: {
        color: '#fff',
        ...theme.typography.caption,
    },
    moodBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.sm,
    },
    moodText: {
        ...theme.typography.caption,
    },
    iconWrapper: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    entryTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
    },
    entryPreview: {
        ...theme.typography.body,
        lineHeight: 22,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.xl,
        alignSelf: 'center',
        flexDirection: 'row',
        height: 60,
        paddingHorizontal: theme.spacing.lg,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabText: {
        color: '#fff',
        ...theme.typography.caption,
        letterSpacing: 2,
    }
});
