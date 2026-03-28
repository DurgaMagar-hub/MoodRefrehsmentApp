import React, { useContext, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Easing } from 'react-native';
import { theme } from '../styles/theme';
import SafeScreen from '../components/SafeScreen';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import FadeInView from '../components/FadeInView';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
    const { user, isDarkTheme, moodHistory, aura, moodInsights } = useContext(MoodContext);
    const lastMood = moodHistory[0];

    // Aura Animation
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 25000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
            ])
        ).start();
    }, []);

    const rotation = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const features = [
        { name: "Emotion Rooms", desc: "Join support circles", path: "EmotionRooms", icon: "💬", color: theme.colors.secondary, priority: 2, cols: 2 },
        { name: "Mood Check", desc: "Track your journey", path: "MoodCheck", icon: "📊", color: theme.colors.accent, priority: 3, cols: 1 },
        { name: "Journal", desc: "Write thoughts", path: "Journal", icon: "📔", color: theme.colors.gold, priority: 2, cols: 1 },
        { name: "Motivation", desc: "Daily inspiration", path: "Motivation", icon: "✨", color: theme.colors.rose, priority: 1, cols: 1 },
        { name: "Breathing", desc: "Relax & Focus", path: "Breathing", icon: "🌬️", color: theme.colors.success, priority: aura?.mode === "low-energy" ? 5 : 2, cols: 1 },
    ];

    const prioritizedFeatures = useMemo(() => {
        return [...features].sort((a, b) => b.priority - a.priority);
    }, [aura]);

    const activeAuraColor = aura?.color || theme.colors.primary;
    const isDark = isDarkTheme;

    return (
        <SafeScreen style={styles.container}>
            <FadeInView delay={0} style={styles.topBar}>
                <View style={styles.greetingHeader}>
                    <Text style={[styles.headerGreeting, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                        {aura?.mode === "low-energy" ? "Deep Calm" : "Welcome Back"}
                    </Text>
                    <Text style={[styles.headerName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                        {user?.name || "Friend"}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('Profile')}
                    activeOpacity={0.85}
                    style={[styles.profileIconBtn, isDark ? styles.profileIconDark : styles.profileIconLight]}
                >
                    <Feather name="user" size={22} color={isDark ? theme.colors.accent : theme.colors.secondary} strokeWidth={1.35} />
                </TouchableOpacity>
            </FadeInView>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <FadeInView delay={100} style={styles.auraSection}>
                    <Animated.View style={[
                        styles.auraContainer, 
                        { transform: [{ rotate: rotation }, { scale: pulseAnim }], ...theme.shadows.glow(activeAuraColor) }
                    ]}>
                        <Svg viewBox="0 0 200 200" style={styles.auraSvg}>
                            <Defs>
                                <SvgLinearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <Stop offset="0%" stopColor={activeAuraColor} />
                                    <Stop offset="100%" stopColor={isDark ? theme.colors.secondary : theme.colors.accent} />
                                </SvgLinearGradient>
                            </Defs>
                            <Path 
                                fill="url(#auraGradient)" 
                                d="M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.6C86.3,-32.7,90.8,-17.7,89.5,-3C88.2,11.7,81.1,26,71.5,38.1C61.9,50.1,49.8,59.9,36.4,66.8C23,73.7,8.2,77.7,-6.6,76.5C-21.4,75.3,-36.2,68.9,-49.4,59.5C-62.7,50.1,-74.5,37.6,-80.1,23C-85.7,8.4,-85.1,-8.3,-79.9,-23.4C-74.8,-38.5,-65.1,-52.1,-52.1,-59.5C-39.1,-66.9,-22.8,-68.1,-7.2,-74.3C8.4,-80.5,16.8,-91.7,31.2,-91.5C45.6,-91.3,55.1,-79.6,44.7,-76.4Z" 
                                transform="translate(100 100)" 
                            />
                        </Svg>
                    </Animated.View>
                    <View style={[styles.auraLabelBox, isDark ? styles.auraLabelDark : styles.auraLabelLight]}>
                        <Text style={styles.auraEmoji}>{lastMood?.mood || "✨"}</Text>
                    </View>
                </FadeInView>

                <FadeInView delay={180}>
                    <TouchableOpacity onPress={() => navigation.navigate('MoodInsights')} activeOpacity={0.88}>
                        <Card isDark={isDark} style={styles.insightPreview}>
                            <View style={styles.insightRow}>
                                <View style={[styles.streakPill, { backgroundColor: theme.colors.secondary + '22' }]}>
                                    <Text style={[styles.streakNum, { color: theme.colors.secondary }]}>
                                        {moodInsights?.streak?.current ?? 0}
                                    </Text>
                                    <Text style={[styles.streakLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                                        day streak
                                    </Text>
                                </View>
                                <Feather name="chevron-right" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} />
                            </View>
                            <Text
                                style={[styles.insightPreviewText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                numberOfLines={2}
                            >
                                {moodInsights?.messages?.headline || 'Open your weekly insights and patterns.'}
                            </Text>
                        </Card>
                    </TouchableOpacity>
                </FadeInView>

                <FadeInView delay={200} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Your Intent</Text>
                </FadeInView>

                <FadeInView delay={260}>
                <TouchableOpacity onPress={() => navigation.navigate(prioritizedFeatures[0].path)} activeOpacity={0.8}>
                    <Card isDark={isDark} style={[styles.primaryCard, { borderColor: activeAuraColor + '55' }]} blurIntensity={isDark ? 50 : 80}>
                        <View style={styles.primaryCardContent}>
                            <View style={[styles.cardIconGlow, { backgroundColor: prioritizedFeatures[0].color + '33' }]}>
                                <Text style={styles.primaryIcon}>{prioritizedFeatures[0].icon}</Text>
                            </View>
                            <View style={styles.cardInfo}>
                                <Text style={[styles.primaryName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                                    {prioritizedFeatures[0].name}
                                </Text>
                                <Text style={[styles.primaryDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                                    {prioritizedFeatures[0].desc}
                                </Text>
                            </View>
                        </View>
                    </Card>
                </TouchableOpacity>
                </FadeInView>

                <FadeInView delay={340} style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Discover</Text>
                </FadeInView>

                <FadeInView delay={400}>
                <View style={styles.masonryGrid}>
                    <View style={styles.masonryColumn}>
                        {prioritizedFeatures.slice(1, 4).filter((_, i) => i % 2 === 0).map((f) => (
                            <TouchableOpacity key={f.name} style={styles.gridItemFlexible} onPress={() => navigation.navigate(f.path)} activeOpacity={0.8}>
                                <Card isDark={isDark} style={[styles.miniCard, { minHeight: f.cols > 1 ? 160 : 180 }]}>
                                    <View style={[styles.miniIconBox, { backgroundColor: f.color + '22' }]}>
                                        <Text style={styles.miniIcon}>{f.icon}</Text>
                                    </View>
                                    <Text numberOfLines={1} style={[styles.miniName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{f.name}</Text>
                                    <Text numberOfLines={2} style={[styles.miniDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{f.desc}</Text>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.masonryColumn}>
                        {prioritizedFeatures.slice(1, 4).filter((_, i) => i % 2 !== 0).map((f) => (
                            <TouchableOpacity key={f.name} style={styles.gridItemFlexible} onPress={() => navigation.navigate(f.path)} activeOpacity={0.8}>
                                <Card isDark={isDark} style={[styles.miniCard, { minHeight: f.cols > 1 ? 160 : 150 }]}>
                                    <View style={[styles.miniIconBox, { backgroundColor: f.color + '22' }]}>
                                        <Text style={styles.miniIcon}>{f.icon}</Text>
                                    </View>
                                    <Text numberOfLines={1} style={[styles.miniName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{f.name}</Text>
                                    <Text numberOfLines={2} style={[styles.miniDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{f.desc}</Text>
                                </Card>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
                </FadeInView>

            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    greetingHeader: {
        flex: 1,
    },
    headerGreeting: {
        ...theme.typography.caption,
        marginBottom: 2,
    },
    headerName: {
        ...theme.typography.h2,
    },
    profileIconBtn: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    profileIconDark: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(240,171,252,0.35)',
        ...theme.shadows.glow('rgba(168,85,247,0.25)'),
    },
    profileIconLight: {
        backgroundColor: 'rgba(255,255,255,0.65)',
        borderColor: 'rgba(124,58,237,0.2)',
        ...theme.shadows.soft,
    },
    scroll: {
        padding: theme.spacing.lg,
        paddingBottom: 100,
    },
    auraSection: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: theme.spacing.xl,
        height: 220, // fixed height to prevent layout shift during scale pulse
    },
    auraContainer: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
    },
    auraSvg: {
        width: '100%',
        height: '100%',
        opacity: 0.85,
    },
    auraLabelBox: {
        width: 84,
        height: 84,
        borderRadius: 42,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderWidth: 1,
    },
    auraLabelDark: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.18)',
    },
    auraLabelLight: {
        backgroundColor: 'rgba(255,255,255,0.75)',
        borderColor: 'rgba(168,85,247,0.2)',
    },
    auraEmoji: {
        fontSize: 40,
    },
    insightPreview: {
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
    },
    insightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.sm,
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    streakNum: { fontSize: 20, fontFamily: theme.fontFamily.displayMedium, fontWeight: '600' },
    streakLabel: { ...theme.typography.caption, letterSpacing: 1, marginLeft: 6 },
    insightPreviewText: { ...theme.typography.body, lineHeight: 22 },
    sectionHeader: {
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
    },
    primaryCard: {
        padding: 0, 
    },
    primaryCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    cardIconGlow: {
        width: 70,
        height: 70,
        borderRadius: theme.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    primaryIcon: {
        fontSize: 34,
    },
    cardInfo: {
        flex: 1,
    },
    primaryName: {
        ...theme.typography.h3,
        marginBottom: 4,
    },
    primaryDesc: {
        ...theme.typography.body,
    },
    masonryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    masonryColumn: {
        width: '48%',
    },
    gridItemFlexible: {
        marginBottom: theme.spacing.md,
    },
    miniCard: {
        padding: theme.spacing.md,
        justifyContent: 'flex-start',
    },
    miniIconBox: {
        width: 48,
        height: 48,
        borderRadius: theme.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    miniIcon: {
        fontSize: 22,
    },
    miniName: {
        ...theme.typography.subtitle,
        marginBottom: 4,
    },
    miniDesc: {
        fontSize: 13,
        fontWeight: '500',
    }
});
