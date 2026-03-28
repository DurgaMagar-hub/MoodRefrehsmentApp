import React, { useContext, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import { Feather } from '@expo/vector-icons';
import { computeWeeklySummary, generateInsightMessages } from '../utils/moodAnalytics';

export default function MoodInsightsScreen({ navigation }) {
    const { moodHistory, isDarkTheme, moodInsights } = useContext(MoodContext);
    const isDark = isDarkTheme;

    const weekly = useMemo(() => computeWeeklySummary(moodHistory), [moodHistory]);
    const copy = useMemo(() => generateInsightMessages(moodHistory), [moodHistory]);
    const badges = moodInsights?.badges || [];

    const maxCount = Math.max(1, ...weekly.week.map((w) => w.count));

    return (
        <SafeScreen style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" size={24} color={isDark ? '#fff' : '#000'} />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Insights</Text>
                    <Text style={[styles.headerSub, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                        Patterns from your check-ins
                    </Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <Card isDark={isDark} style={styles.heroCard}>
                    <Text style={[styles.heroLabel, { color: theme.colors.secondary }]}>This week</Text>
                    <Text style={[styles.heroText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{copy.headline}</Text>
                    {copy.supporting.map((line, i) => (
                        <Text key={i} style={[styles.support, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                            {line}
                        </Text>
                    ))}
                </Card>

                <Text style={[styles.sectionLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>7-day rhythm</Text>
                <Card isDark={isDark} style={styles.chartCard}>
                    <View style={styles.bars}>
                        {weekly.week.map((w) => {
                            const h = w.count ? (w.count / maxCount) * 120 : 4;
                            const day = w.date.slice(5);
                            return (
                                <View key={w.date} style={styles.barCol}>
                                    <View
                                        style={[
                                            styles.bar,
                                            {
                                                height: h,
                                                backgroundColor:
                                                    w.count > 0 ? theme.colors.secondary : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                            },
                                        ]}
                                    />
                                    <Text style={[styles.barDay, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{day}</Text>
                                    <Text style={[styles.barMeta, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{w.count || ''}</Text>
                                </View>
                            );
                        })}
                    </View>
                    <Text style={[styles.chartCaption, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                        {weekly.totalLogs} check-ins · avg energy {weekly.avgEnergy != null ? `${weekly.avgEnergy}%` : '—'}
                    </Text>
                </Card>

                <Text style={[styles.sectionLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Achievements</Text>
                <View style={styles.badgeGrid}>
                    {badges.map((b) => (
                        <Card key={b.id} isDark={isDark} style={styles.badgeCard} noPadding>
                            <View style={styles.badgeInner}>
                                <Feather name="award" size={20} color={theme.colors.primary} />
                                <Text style={[styles.badgeTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{b.title}</Text>
                                <Text style={[styles.badgeDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{b.desc}</Text>
                            </View>
                        </Card>
                    ))}
                    {!badges.length && (
                        <Text style={{ color: isDark ? theme.dark.textSub : theme.light.textSub, paddingHorizontal: 8 }}>
                            Keep checking in to unlock badges.
                        </Text>
                    )}
                </View>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.md,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.soft,
    },
    headerTitle: { ...theme.typography.h2 },
    headerSub: { ...theme.typography.caption, marginTop: 4 },
    scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: 100 },
    heroCard: { marginBottom: theme.spacing.lg },
    heroLabel: { ...theme.typography.caption, marginBottom: 8 },
    heroText: { ...theme.typography.h3, marginBottom: 12 },
    support: { ...theme.typography.body, marginTop: 8 },
    sectionLabel: { ...theme.typography.label, marginBottom: 10, marginTop: 8 },
    chartCard: { marginBottom: theme.spacing.lg },
    bars: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 140, paddingTop: 8 },
    barCol: { alignItems: 'center', flex: 1 },
    bar: { width: 10, borderRadius: 5, minHeight: 4 },
    barDay: { fontSize: 9, marginTop: 8 },
    barMeta: { fontSize: 11, fontFamily: theme.fontFamily.bodySemi, marginTop: 2 },
    chartCaption: { ...theme.typography.small, marginTop: 16, textAlign: 'center' },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0, marginBottom: 24 },
    badgeCard: { width: '48%', marginHorizontal: '1%', marginBottom: 12 },
    badgeInner: { padding: theme.spacing.md },
    badgeTitle: { ...theme.typography.subtitle, marginTop: 8 },
    badgeDesc: { ...theme.typography.small, marginTop: 4 },
});
