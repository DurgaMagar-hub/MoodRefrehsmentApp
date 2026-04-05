import React, { useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Dimensions, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import SafeScreen from '../components/SafeScreen';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '../config';
import { parseBackendDate } from '../utils/deviceTime';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
    const { accounts, logout, deleteAccount, toggleAccountRole, isDarkTheme } = useContext(MoodContext);
    const [isLoading, setIsLoading] = useState(false);
    const [allMoods, setAllMoods] = useState([]);
    const isDark = isDarkTheme;

    useFocusEffect(
        useCallback(() => {
            const onHardwareBack = () => true;
            const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBack);
            return () => sub.remove();
        }, [])
    );

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await axios.get(`${API_URL}/moods`);
                if (!cancelled && Array.isArray(res.data)) setAllMoods(res.data);
            } catch {
                if (!cancelled) setAllMoods([]);
            }
        })();
        return () => { cancelled = true; };
    }, [accounts.length]);

    const platformStats = useMemo(() => {
        const n = allMoods.length;
        if (!n) return { avgEnergy: null, last7: 0 };
        const sum = allMoods.reduce((s, m) => s + (Number(m.energy) || 0), 0);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const recent = allMoods.filter((m) => {
            const t = parseBackendDate(m.createdAt);
            return t && t >= cutoff;
        });
        return { avgEnergy: Math.round(sum / n), last7: recent.length };
    }, [allMoods]);

    const stats = [
        { label: "Total Users", value: accounts.length, icon: "users" },
        { label: "Mood Logs", value: allMoods.length, icon: "activity" },
        { label: "Avg Energy", value: platformStats.avgEnergy != null ? `${platformStats.avgEnergy}%` : "—", icon: "bar-chart-2" },
        { label: "Logs (7d)", value: platformStats.last7, icon: "trending-up" },
    ];

    const handleDelete = (account) => {
        const performDelete = async () => {
            setIsLoading(true);
            await deleteAccount(account.email);
            setIsLoading(false);
        };

        if (Platform.OS === 'web') {
            if (window.confirm(`Are you sure you want to delete ${account.email}?`)) {
                performDelete();
            }
        } else {
            Alert.alert("Delete Account", `Are you sure you want to delete ${account.email}?`, [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: performDelete }
            ]);
        }
    };

    const handleSignOut = () => {
        if (Platform.OS === 'web') {
            if (window.confirm("Are you sure you want to sign out?")) {
                logout();
                navigation.replace('Login');
            }
        } else {
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                { text: "Cancel", style: "cancel" },
                { text: "Sign Out", style: "destructive", onPress: () => { logout(); navigation.replace('Login'); } }
            ]);
        }
    };

    const handleToggleRole = async (account) => {
        setIsLoading(true);
        await toggleAccountRole(account.email);
        setIsLoading(false);
    };

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            <View style={styles.header}>
                <View style={styles.headerSideSpacer} />
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Admin Console</Text>
                    <Text style={styles.headerSub}>Full System Control</Text>
                </View>
                <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.colors.danger + '15' }]} onPress={handleSignOut}>
                    <Feather name="log-out" size={16} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Stats */}
                <View style={styles.statsRow}>
                    {stats.map((stat, idx) => (
                        <View key={idx} style={styles.statWrap}>
                            <Card isDark={isDark} style={styles.statCard} intensity={isDark ? 34 : 62} noPadding>
                                <View style={styles.statInner}>
                                <View style={[styles.statIconBox, { backgroundColor: theme.colors.primary + '22' }]}>
                                    <Feather name={stat.icon} size={22} color={theme.colors.primary} />
                                </View>
                                <Text style={[styles.statValue, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{stat.value}</Text>
                                <Text style={[styles.statLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{stat.label}</Text>
                                </View>
                            </Card>
                        </View>
                    ))}
                </View>

                {/* Controls */}
                <Text style={[styles.sectionTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Monitoring Controls</Text>
                <View style={styles.controlsGrid}>
                    <TouchableOpacity style={styles.controlItem} onPress={() => navigation.navigate('EmotionRooms')} activeOpacity={0.8}>
                        <Card isDark={isDark} style={styles.controlCard} intensity={isDark ? 34 : 62} noPadding>
                            <View style={styles.controlInner}>
                            <View style={[styles.controlIcon, { backgroundColor: theme.colors.secondary + '22' }]}>
                                <Feather name="message-square" color={theme.colors.secondary} size={22} />
                            </View>
                            <Text style={[styles.controlName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Rooms</Text>
                            <Text style={[styles.controlDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Track chats</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlItem} onPress={() => navigation.navigate('AdminChatReports')} activeOpacity={0.8}>
                        <Card isDark={isDark} style={styles.controlCard} intensity={isDark ? 34 : 62} noPadding>
                            <View style={styles.controlInner}>
                            <View style={[styles.controlIcon, { backgroundColor: theme.colors.danger + '22' }]}>
                                <Feather name="flag" color={theme.colors.danger} size={22} />
                            </View>
                            <Text style={[styles.controlName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Reports</Text>
                            <Text style={[styles.controlDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Chat moderation</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.controlItem} onPress={() => navigation.navigate('Motivation')} activeOpacity={0.8}>
                        <Card isDark={isDark} style={styles.controlCard} intensity={isDark ? 34 : 62} noPadding>
                            <View style={styles.controlInner}>
                            <View style={[styles.controlIcon, { backgroundColor: theme.colors.accent + '22' }]}>
                                <Feather name="zap" color={theme.colors.accent} size={22} />
                            </View>
                            <Text style={[styles.controlName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Inspiration</Text>
                            <Text style={[styles.controlDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Manage quotes</Text>
                            </View>
                        </Card>
                    </TouchableOpacity>
                </View>

                {/* User List */}
                <View style={styles.userListHeader}>
                    <Text style={[styles.sectionTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain, marginBottom: 0 }]}>User Management</Text>
                    {isLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                </View>

                <View style={styles.userList}>
                    {accounts.map((account) => (
                        <Card key={account.email} isDark={isDark} style={styles.userCard} intensity={isDark ? 30 : 56} noPadding>
                            <View style={styles.userInner}>
                            <View style={[styles.avatar, { backgroundColor: account.color || theme.colors.primary + '22' }]}>
                                <Text style={styles.avatarEmoji}>{account.avatar || "👤"}</Text>
                            </View>
                            
                            <View style={styles.userInfo}>
                                <Text style={[styles.userName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{account.name || "Anonymous"}</Text>
                                <Text style={[styles.userEmail, { color: isDark ? theme.dark.textSub : theme.light.textSub }]} numberOfLines={1}>{account.email}</Text>
                            </View>

                            <View style={styles.userActions}>
                                <TouchableOpacity 
                                    style={[styles.roleLabel, { backgroundColor: account.role === 'admin' ? theme.colors.primary : (isDark ? theme.colors.glassDark : '#eee') }]}
                                    onPress={() => handleToggleRole(account)}
                                    disabled={account.email === "admin@mood.com"}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.roleText, { color: account.role === 'admin' ? '#fff' : (isDark ? theme.dark.textSub : '#666') }]}>
                                        {account.role?.toUpperCase() || 'USER'}
                                    </Text>
                                </TouchableOpacity>

                                {account.email !== "admin@mood.com" && (
                                    <TouchableOpacity style={[styles.deleteBtn, { backgroundColor: theme.colors.danger + '15' }]} onPress={() => handleDelete(account)}>
                                        <Feather name="trash-2" color={theme.colors.danger} size={18} />
                                    </TouchableOpacity>
                                )}
                            </View>
                            </View>
                        </Card>
                    ))}
                </View>
            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
    },
    headerSideSpacer: {
        width: 40,
        height: 40,
    },
    headerInfo: {
        marginLeft: theme.spacing.sm,
        flex: 1,
    },
    headerTitle: {
        ...theme.typography.h3,
    },
    headerSub: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 2,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scroll: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: 60,
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 24,
        marginTop: theme.spacing.md,
        justifyContent: 'space-between',
    },
    statWrap: {
        width: '48%',
        marginBottom: 12,
    },
    statCard: {
        borderRadius: theme.borderRadius.xl,
    },
    statInner: {
        padding: 20,
        alignItems: 'center',
    },
    statIconBox: {
        width: 50,
        height: 50,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 32,
        fontFamily: theme.fontFamily.displaySemi,
    },
    statLabel: {
        ...theme.typography.caption,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginTop: 4,
    },
    sectionTitle: {
        ...theme.typography.caption,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: 16,
        opacity: 0.6,
        marginLeft: 4,
    },
    controlsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 32,
        justifyContent: 'space-between',
    },
    controlItem: {
        width: '48.5%',
        marginBottom: 12,
    },
    controlCard: {
        borderRadius: 24,
    },
    controlInner: {
        padding: 16,
    },
    controlIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    controlName: {
        ...theme.typography.subtitle,
        fontWeight: '900',
    },
    controlDesc: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    userListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    userList: {
        paddingBottom: 20,
    },
    userCard: {
        borderRadius: 24,
        marginBottom: 12, // Replaces gap
    },
    userInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 24,
    },
    userInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        ...theme.typography.subtitle,
        fontWeight: '900',
    },
    userEmail: {
        ...theme.typography.caption,
        marginTop: 2,
    },
    userActions: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 4,
    },
    roleLabel: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        marginRight: 10, // Replaces gap
    },
    roleText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    deleteBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
