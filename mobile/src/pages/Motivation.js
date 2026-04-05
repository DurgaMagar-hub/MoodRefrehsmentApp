import React, { useContext, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Dimensions,
    FlatList,
    Animated,
    Alert,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

const FALLBACK_DAILY_DROPS = [
    {
        id: 'fallback_1',
        text: "Happiness is not something ready made. It comes from your own actions.",
        author: 'Dalai Lama',
        colors: ['#a855f7', '#e879f9'],
    },
    {
        id: 'fallback_2',
        text: "The only limit to our realization of tomorrow will be our doubts of today.",
        author: 'F.D. Roosevelt',
        colors: ['#c084fc', '#f0abfc'],
    },
    {
        id: 'fallback_3',
        text: "You don't have to be great to start, but you have to start to be great.",
        author: 'Zig Ziglar',
        colors: ['#d4a574', '#fda4af'],
    },
];

export default function MotivationScreen({ navigation }) {
    const { user, quotes, addQuote, deleteUserQuote, isDarkTheme } = useContext(MoodContext);
    const [newQuote, setNewQuote] = useState('');
    const scrollX = useRef(new Animated.Value(0)).current;

    const [dailyDrops, setDailyDrops] = useState([]);
    const [dailyLoading, setDailyLoading] = useState(true);

    const [adminDropText, setAdminDropText] = useState('');
    const [adminDropAuthor, setAdminDropAuthor] = useState('');

    const isAdmin = user?.role === 'admin';

    const loadDailyDrops = useCallback(async () => {
        try {
            setDailyLoading(true);
            const res = await axios.get(`${API_URL}/daily-drops`);
            setDailyDrops(Array.isArray(res.data) ? res.data : []);
        } catch (_) {
            setDailyDrops([]);
        } finally {
            setDailyLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDailyDrops().catch(() => {});
    }, [loadDailyDrops]);

    useEffect(() => {
        const unsub = navigation?.addListener?.('focus', () => {
            loadDailyDrops().catch(() => {});
        });
        return () => {
            if (typeof unsub === 'function') unsub();
        };
    }, [navigation, loadDailyDrops]);

    const carouselData = useMemo(() => {
        if (dailyDrops.length > 0) return dailyDrops;
        return FALLBACK_DAILY_DROPS;
    }, [dailyDrops]);

    const vaultQuotes = useMemo(() => {
        return (quotes || []).map((q, i) =>
            typeof q === 'string' ? { id: `legacy_${i}`, text: q } : { id: q.id, text: q.text }
        );
    }, [quotes]);

    const handleAddVault = () => {
        if (newQuote.trim()) {
            addQuote(newQuote.trim());
            setNewQuote('');
        }
    };

    const handleDeleteVault = (q) => {
        if (!q?.id || String(q.id).startsWith('legacy_')) return;
        Alert.alert('Remove quote', 'Remove this from your private vault?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: () => deleteUserQuote(q.id).catch(() => Alert.alert('Error', 'Could not remove quote.')),
            },
        ]);
    };

    const handleAddDailyDrop = async () => {
        const t = adminDropText.trim();
        if (!t) return;
        try {
            await axios.post(`${API_URL}/daily-drops`, {
                text: t,
                author: adminDropAuthor.trim() || 'Inspiration',
                role: 'admin',
            });
            setAdminDropText('');
            setAdminDropAuthor('');
            await loadDailyDrops();
        } catch (e) {
            Alert.alert('Error', e?.response?.data?.error || 'Could not add daily drop.');
        }
    };

    const handleDeleteDailyDrop = (drop) => {
        Alert.alert('Remove daily drop', 'Remove this card from everyone’s carousel?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Remove',
                style: 'destructive',
                onPress: async () => {
                    try {
                        await axios.delete(`${API_URL}/daily-drops/${drop.id}?role=admin`);
                        await loadDailyDrops();
                    } catch (e) {
                        Alert.alert('Error', 'Could not remove daily drop.');
                    }
                },
            },
        ]);
    };

    const renderQuoteCard = ({ item }) => {
        const colors = item.colors && item.colors.length >= 2 ? item.colors : ['#7aa6ff', '#7bdcb5'];
        return (
            <View style={styles.cardWrapper}>
                <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.featuredCard}>
                    <View style={styles.badge}>
                        <Feather name="zap" size={14} color="#fff" />
                        <Text style={styles.badgeText}>DAILY DROP</Text>
                    </View>
                    <Text style={styles.quoteText}>"{item.text}"</Text>
                    <View style={styles.authorRow}>
                        <View style={styles.authorLine} />
                        <Text style={styles.authorText}>{item.author || 'Inspiration'}</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background }]}>
            <View style={styles.topBar}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" size={24} color={isDarkTheme ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Inspiration</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.swipeHintRow}>
                    <Text style={[styles.swipeHint, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                        Swipe the daily drops
                    </Text>
                    <Feather name="arrow-right" size={12} color={isDarkTheme ? theme.dark.textSub : theme.light.textSub} style={{ opacity: 0.5 }} />
                </View>

                <View style={styles.carouselContainer}>
                    {dailyLoading && dailyDrops.length === 0 ? (
                        <Text style={{ textAlign: 'center', color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }}>
                            Loading…
                        </Text>
                    ) : (
                        <Animated.FlatList
                            data={carouselData}
                            keyExtractor={(item) => String(item.id)}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            snapToAlignment="center"
                            decelerationRate="fast"
                            bounces={false}
                            renderItem={renderQuoteCard}
                            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                                useNativeDriver: true,
                            })}
                        />
                    )}
                </View>

                {isAdmin ? (
                    <>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                                Daily Drop (admin)
                            </Text>
                            <Text style={[styles.sectionHint, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                                These cards appear for everyone. Your private vault is separate below.
                            </Text>
                        </View>
                        <View style={{ paddingHorizontal: theme.spacing.lg, marginBottom: theme.spacing.lg }}>
                            <Card isDark={isDarkTheme} style={{ borderRadius: 20 }} intensity={isDarkTheme ? 28 : 56} noPadding>
                                <View style={{ padding: theme.spacing.md }}>
                                    <TextInput
                                        style={[styles.adminInput, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                                        placeholder="Quote text"
                                        placeholderTextColor={isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                                        value={adminDropText}
                                        onChangeText={setAdminDropText}
                                        multiline
                                    />
                                    <TextInput
                                        style={[styles.adminInputSmall, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                                        placeholder="Author (optional)"
                                        placeholderTextColor={isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                                        value={adminDropAuthor}
                                        onChangeText={setAdminDropAuthor}
                                    />
                                    <TouchableOpacity
                                        style={[styles.adminAddBtn, { backgroundColor: theme.colors.primary }]}
                                        onPress={handleAddDailyDrop}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.adminAddBtnText}>Add to Daily Drop</Text>
                                    </TouchableOpacity>
                                </View>
                            </Card>
                            {dailyDrops.length ? (
                                <View style={{ marginTop: theme.spacing.md }}>
                                    {dailyDrops.map((d) => (
                                        <Card
                                            key={d.id}
                                            isDark={isDarkTheme}
                                            style={{ marginBottom: 10, borderRadius: 16 }}
                                            intensity={isDarkTheme ? 24 : 48}
                                            noPadding
                                        >
                                            <View style={styles.adminDropRow}>
                                                <Text
                                                    style={[styles.adminDropPreview, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                                                    numberOfLines={2}
                                                >
                                                    {d.text}
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => handleDeleteDailyDrop(d)}
                                                    style={[styles.adminTrash, { backgroundColor: theme.colors.danger + '18' }]}
                                                >
                                                    <Feather name="trash-2" size={16} color={theme.colors.danger} />
                                                </TouchableOpacity>
                                            </View>
                                        </Card>
                                    ))}
                                </View>
                            ) : null}
                        </View>
                    </>
                ) : null}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Save a Thought</Text>
                    <Text style={[styles.sectionHint, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                        Only you can see your saved thoughts.
                    </Text>
                </View>

                <View
                    style={[
                        styles.inputBox,
                        {
                            backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card,
                            borderColor: isDarkTheme ? theme.dark.border : theme.light.border,
                        },
                    ]}
                >
                    <TextInput
                        style={[styles.input, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                        placeholder="Type a quote that moves you..."
                        placeholderTextColor={isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                        value={newQuote}
                        onChangeText={setNewQuote}
                        multiline
                    />
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            {
                                backgroundColor: newQuote.trim()
                                    ? theme.colors.primary
                                    : isDarkTheme
                                      ? theme.dark.border
                                      : theme.light.backgroundSecondary,
                            },
                        ]}
                        onPress={handleAddVault}
                        disabled={!newQuote.trim()}
                        activeOpacity={0.8}
                    >
                        <Feather name="plus" color={newQuote.trim() ? '#fff' : isDarkTheme ? '#555' : '#aaa'} size={20} />
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionHeader}>
                    <View style={styles.vaultHeader}>
                        <Text style={[styles.sectionTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Your Vault</Text>
                        <View
                            style={[
                                styles.countBadge,
                                { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.backgroundSecondary },
                            ]}
                        >
                            <Text style={[styles.countText, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                                {vaultQuotes.length} saved
                            </Text>
                        </View>
                    </View>
                </View>

                {vaultQuotes.length === 0 ? (
                    <View style={styles.emptyVault}>
                        <Feather name="bookmark" size={48} color={isDarkTheme ? theme.dark.border : theme.light.border} />
                        <Text style={[styles.emptyText, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                            Your vault is empty. Save a private thought above.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.vaultList}>
                        {vaultQuotes.map((q, i) => (
                            <Card key={q.id || i} isDark={isDarkTheme} style={styles.quoteListItem} noPadding>
                                <View style={styles.quoteInner}>
                                    <Feather name="lock" size={18} color={theme.colors.secondary} style={styles.quoteIcon} />
                                    <Text style={[styles.vaultQuoteText, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                                        {q.text}
                                    </Text>
                                    {!String(q.id).startsWith('legacy_') ? (
                                        <TouchableOpacity
                                            onPress={() => handleDeleteVault(q)}
                                            style={[styles.quoteDeleteBtn, { backgroundColor: theme.colors.danger + '14' }]}
                                            activeOpacity={0.8}
                                        >
                                            <Feather name="trash-2" size={16} color={theme.colors.danger} />
                                        </TouchableOpacity>
                                    ) : null}
                                </View>
                            </Card>
                        ))}
                    </View>
                )}
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
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.sm,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.soft,
    },
    title: {
        ...theme.typography.h2,
        marginLeft: theme.spacing.md,
    },
    scroll: {
        paddingTop: theme.spacing.md,
        paddingBottom: 60,
    },
    swipeHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    swipeHint: {
        ...theme.typography.caption,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginRight: 6,
    },
    carouselContainer: {
        height: 280,
        marginBottom: theme.spacing.xl,
    },
    cardWrapper: {
        width: width,
        paddingHorizontal: theme.spacing.lg,
    },
    featuredCard: {
        flex: 1,
        padding: 32,
        borderRadius: 32,
        justifyContent: 'center',
        ...theme.shadows.glow(theme.colors.primary),
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
        letterSpacing: 1,
    },
    quoteText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 36,
        marginBottom: 24,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorLine: {
        width: 30,
        height: 2,
        backgroundColor: '#fff',
        opacity: 0.6,
        marginRight: 12,
    },
    authorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
    },
    sectionHint: {
        ...theme.typography.small,
        marginTop: 6,
        opacity: 0.85,
    },
    adminInput: {
        borderWidth: 1,
        borderColor: 'rgba(122,166,255,0.25)',
        borderRadius: 14,
        padding: 12,
        minHeight: 72,
        marginBottom: 10,
        ...theme.typography.body,
    },
    adminInputSmall: {
        borderWidth: 1,
        borderColor: 'rgba(122,166,255,0.25)',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        ...theme.typography.body,
    },
    adminAddBtn: {
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
    },
    adminAddBtnText: {
        color: '#fff',
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    adminDropRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    adminDropPreview: {
        flex: 1,
        ...theme.typography.body,
        marginRight: 10,
    },
    adminTrash: {
        width: 40,
        height: 40,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: theme.spacing.lg,
        padding: 12,
        paddingLeft: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: theme.spacing.xl,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    saveBtn: {
        width: 48,
        height: 48,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    vaultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        ...theme.typography.caption,
    },
    emptyVault: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 15,
        fontStyle: 'italic',
        paddingHorizontal: 40,
    },
    vaultList: {
        paddingHorizontal: theme.spacing.lg,
    },
    quoteListItem: {
        borderRadius: 24,
        marginBottom: 16,
    },
    quoteInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 18,
    },
    quoteIcon: {
        opacity: 0.85,
        marginRight: 12,
        marginTop: 2,
    },
    quoteDeleteBtn: {
        width: 38,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    vaultQuoteText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
        fontWeight: '500',
    },
});
