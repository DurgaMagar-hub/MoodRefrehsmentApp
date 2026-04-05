import React, { useState, useCallback, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import Card from '../components/Card';
import { getOrCreateReportClientKey } from '../utils/reportClientId';
import { formatDeviceDateTime } from '../utils/deviceTime';

export default function MyChatReportsScreen({ navigation }) {
    const { user, isDarkTheme } = useContext(MoodContext);
    const isDark = isDarkTheme;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        try {
            const params =
                user?.id != null
                    ? { reporterUserId: user.id }
                    : { reporterClientKey: await getOrCreateReportClientKey() };
            const res = await axios.get(`${API_URL}/chat-reports/mine`, { params });
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const renderItem = ({ item }) => (
        <Card isDark={isDark} style={styles.card} intensity={isDark ? 34 : 62} noPadding>
            <View style={styles.cardInner}>
                <Text style={[styles.meta, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                    Message #{item.messageId} · {item.roomName} ·{' '}
                    {formatDeviceDateTime(item.createdAt)}
                </Text>
                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                    Sender account id (if they were signed in)
                </Text>
                <Text style={[styles.uid, { color: theme.colors.secondary }]}>
                    {item.reportedUserId != null ? item.reportedUserId : '— (guest / not signed in)'}
                </Text>
                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Message you reported</Text>
                <Text style={[styles.body, { color: isDark ? theme.dark.textMain : theme.light.textMain }]} numberOfLines={6}>
                    {item.messageText || '(empty)'}
                </Text>
                {item.reason ? (
                    <>
                        <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Your note</Text>
                        <Text style={[styles.body, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{item.reason}</Text>
                    </>
                ) : null}
            </View>
        </Card>
    );

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" color={isDark ? '#fff' : '#000'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>My chat reports</Text>
            </View>
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={rows}
                    keyExtractor={(item) => String(item.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    ListEmptyComponent={
                        <Text style={[styles.empty, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                            You have not submitted any reports yet.
                        </Text>
                    }
                />
            )}
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
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
        ...theme.typography.h3,
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: theme.spacing.lg, paddingBottom: 48 },
    card: { marginBottom: theme.spacing.md, borderRadius: theme.borderRadius.lg },
    cardInner: { padding: theme.spacing.md },
    meta: { fontSize: 11, marginBottom: 8 },
    label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
    uid: { fontSize: 16, fontFamily: theme.fontFamily.displaySemi, marginTop: 2 },
    body: { marginTop: 4, fontSize: 15, lineHeight: 21 },
    empty: { textAlign: 'center', marginTop: 48, paddingHorizontal: 24 },
});
