import React, { useState, useCallback, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';
import Card from '../components/Card';

export default function AdminChatReportsScreen({ navigation }) {
    const { user, isDarkTheme, deleteAccount } = useContext(MoodContext);
    const isDark = isDarkTheme;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async () => {
        if (user?.role !== 'admin' || !user?.id) {
            setRows([]);
            setLoading(false);
            return;
        }
        try {
            const res = await axios.get(`${API_URL}/chat-reports`, {
                params: { adminUserId: user.id },
            });
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch {
            setRows([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?.id, user?.role]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = () => {
        setRefreshing(true);
        load();
    };

    const dismissReport = (reportId) => {
        const run = async () => {
            try {
                await axios.delete(`${API_URL}/chat-reports/${reportId}`, {
                    params: { adminUserId: user.id },
                });
                setRows((prev) => prev.filter((r) => r.id !== reportId));
            } catch (e) {
                Alert.alert('Error', e.response?.data?.error || 'Could not dismiss');
            }
        };
        if (Platform.OS === 'web') {
            if (window.confirm('Dismiss this report?')) run();
        } else {
            Alert.alert('Dismiss report?', undefined, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Dismiss', onPress: run },
            ]);
        }
    };

    const banReportedUser = (email, reportId) => {
        if (!email) {
            Alert.alert(
                'No account to delete',
                'This message was sent without a signed-in user. You can dismiss the report or moderate by message content only.'
            );
            return;
        }
        const run = async () => {
            await deleteAccount(email);
            try {
                await axios.delete(`${API_URL}/chat-reports/${reportId}`, {
                    params: { adminUserId: user.id },
                });
            } catch (_) {}
            setRows((prev) => prev.filter((r) => r.id !== reportId));
        };
        if (Platform.OS === 'web') {
            if (window.confirm(`Delete account ${email}?`)) run();
        } else {
            Alert.alert('Delete user', `Remove ${email} from the app?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: run },
            ]);
        }
    };

    const renderItem = ({ item }) => (
        <Card isDark={isDark} style={styles.card} intensity={isDark ? 34 : 62} noPadding>
            <View style={styles.cardInner}>
                <Text style={[styles.meta, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                    Report #{item.id} · msg #{item.messageId} · {item.roomName}
                </Text>
                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Sender user id</Text>
                <Text style={[styles.uid, { color: theme.colors.primary }]}>
                    {item.reportedUserId != null ? item.reportedUserId : '— (no account)'}
                </Text>
                <Text style={[styles.small, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                    {item.reportedEmail ? `${item.reportedEmail} · ${item.reportedName || '—'}` : 'Signed-in sender unknown — message text only'}
                </Text>
                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Reporter</Text>
                <Text style={[styles.small, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                    {item.reporterUserId != null
                        ? `User id ${item.reporterUserId} · ${item.reporterEmail || '—'}`
                        : `Guest device · ${
                              item.reporterClientKey
                                  ? String(item.reporterClientKey).slice(0, 24) + '…'
                                  : '—'
                          }`}
                </Text>
                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Message text</Text>
                <Text style={[styles.body, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{item.messageText}</Text>
                {item.reason ? (
                    <Text style={[styles.reason, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Note: {item.reason}</Text>
                ) : null}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.btn, styles.btnLeft, { backgroundColor: theme.colors.danger + '22' }]}
                        onPress={() => banReportedUser(item.reportedEmail, item.id)}
                        activeOpacity={0.8}
                    >
                        <Feather name="user-x" size={16} color={theme.colors.danger} />
                        <Text style={[styles.btnText, { color: theme.colors.danger }]}>Delete user</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.btn, { backgroundColor: isDark ? theme.colors.glassDark : '#eee' }]}
                        onPress={() => dismissReport(item.id)}
                        activeOpacity={0.8}
                    >
                        <Feather name="x-circle" size={16} color={isDark ? '#fff' : '#333'} />
                        <Text style={[styles.btnText, { color: isDark ? '#fff' : '#333' }]}>Dismiss</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Card>
    );

    if (user?.role !== 'admin') {
        return (
            <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
                <Text style={{ padding: 24, color: isDark ? theme.dark.textMain : theme.light.textMain }}>Admin only.</Text>
            </SafeScreen>
        );
    }

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
                <View style={{ flex: 1 }}>
                    <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Chat reports</Text>
                    <Text style={[styles.sub, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                        User id is stable if display name changes
                    </Text>
                </View>
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
                        <Text style={[styles.empty, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>No open reports.</Text>
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
        marginRight: theme.spacing.md,
        ...theme.shadows.soft,
    },
    title: { ...theme.typography.h3 },
    sub: { ...theme.typography.caption, marginTop: 2 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    list: { padding: theme.spacing.lg, paddingBottom: 48 },
    card: { marginBottom: theme.spacing.md, borderRadius: theme.borderRadius.lg },
    cardInner: { padding: theme.spacing.md },
    meta: { fontSize: 11, marginBottom: 8 },
    label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 8 },
    uid: { fontSize: 18, fontFamily: theme.fontFamily.displaySemi },
    small: { fontSize: 13, marginTop: 4 },
    body: { marginTop: 6, fontSize: 15, lineHeight: 21 },
    reason: { marginTop: 8, fontSize: 13 },
    actions: { flexDirection: 'row', marginTop: 14 },
    btn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
    },
    btnLeft: { marginRight: 10 },
    btnText: { fontWeight: '700', fontSize: 14 },
    empty: { textAlign: 'center', marginTop: 48 },
});
