import React, { useContext, useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    TextInput, 
    Animated, 
    Alert, 
    Switch,
    Modal,
    Dimensions,
    ActivityIndicator,
    Platform,
    BackHandler
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { generateIdentity } from '../utils/identity';
import Card from '../components/Card';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../config';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
    const { 
        user, logout, 
        moodHistory, journalEntries, 
        settings, setSettings, 
        isDarkTheme, aura,
        updateUserIdentity, clearAllData
    } = useContext(MoodContext);
    
    const isDark = isDarkTheme;

    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState(user?.name || "");
    const [isLoading, setIsLoading] = useState(false);
    
    // Modals
    const [showWipeConfirm, setShowWipeConfirm] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");

    const auraScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(auraScale, { toValue: 1.15, duration: 4000, useNativeDriver: true }),
                Animated.timing(auraScale, { toValue: 1, duration: 4000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    useEffect(() => {
        const backAction = () => {
            if (showWipeConfirm) {
                setShowWipeConfirm(false);
                return true;
            }
            if (showResetModal) {
                setShowResetModal(false);
                setError("");
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [showWipeConfirm, showResetModal]);

    const handleBack = () => {
        if (showWipeConfirm) {
            setShowWipeConfirm(false);
        } else if (showResetModal) {
            setShowResetModal(false);
            setError("");
        } else {
            navigation.goBack();
        }
    };

    const handleRegenerate = async () => {
        setIsLoading(true);
        const newIdentity = generateIdentity();
        setEditedName(newIdentity.name);
        try {
            await updateUserIdentity(user.email, newIdentity);
        } catch (err) {
            console.error("Failed to save new identity");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateName = async () => {
        if (editedName.trim() && editedName !== user.name) {
            try {
                await updateUserIdentity(user.email, { ...user, name: editedName });
            } catch (err) {
                console.error("Failed to update name");
            }
        }
        setIsEditingName(false);
    };

    const cycleTheme = () => {
        const modes = ['system', 'light', 'dark'];
        const current = settings?.theme || 'system';
        const next = modes[(modes.indexOf(current) + 1) % modes.length];
        setSettings({ ...settings, theme: next });
    };

    const toggleNotifications = () => {
        setSettings({ ...settings, notifications: !settings?.notifications });
    };

    const handleTriggerReset = async () => {
        setIsLoading(true);
        try {
            await axios.post(`${API_URL}/auth/forgot-password`, { email: user.email });
            setShowResetModal(true);
        } catch (err) {
            Alert.alert("Reset Error", err.response?.data?.error || "Error sending reset code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishReset = async () => {
        if (otp.length < 4 || newPassword.length < 6) {
            setError("Please complete all fields 🔐");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await axios.post(`${API_URL}/auth/reset-password`, { email: user.email, otp, newPassword });
            setShowResetModal(false);
            setOtp("");
            setNewPassword("");
            Alert.alert("Success", "Password updated successfully! ✨");
        } catch (err) {
            setError(err.response?.data?.error || "Error resetting password");
        } finally {
            setIsLoading(false);
        }
    };

    const handleWipe = async () => {
        await clearAllData();
        setShowWipeConfirm(false);
        navigation.replace('Login');
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

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={handleBack} 
                    style={[styles.backButton, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" color={isDark ? '#fff' : '#000'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Your Identity</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {/* Identity Card */}
                <Card isDark={isDark} style={styles.identityCard} intensity={isDark ? 30 : 60}>
                    <View style={styles.avatarWrapper}>
                        <Animated.View style={[
                            styles.auraCircle, 
                            { transform: [{ scale: auraScale }], backgroundColor: aura?.color || theme.colors.primary },
                            theme.shadows.glow(aura?.color || theme.colors.primaryGlow)
                        ]} />
                        <View style={styles.avatarMain}>
                            <Text style={styles.avatarEmoji}>{user?.avatar || "👤"}</Text>
                        </View>
                    </View>

                    <View style={styles.nameRow}>
                        {isEditingName ? (
                            <TextInput 
                                value={editedName}
                                onChangeText={setEditedName}
                                onBlur={handleUpdateName}
                                autoFocus
                                style={[styles.nameInput, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                            />
                        ) : (
                            <TouchableOpacity onPress={() => setIsEditingName(true)} style={styles.nameTouch} activeOpacity={0.7}>
                                <Text style={[styles.userName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{user?.name}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleRegenerate} style={[styles.refreshBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary }]} disabled={isLoading} activeOpacity={0.7}>
                            {isLoading ? (
                                <ActivityIndicator size="small" color={theme.colors.primary} />
                            ) : (
                                <Feather name="refresh-ccw" color={theme.colors.primary} size={20} />
                            )}
                        </TouchableOpacity>
                    </View>
                    
                    <View style={[styles.levelBadge, { backgroundColor: (aura?.color || theme.colors.primary) + "22" }]}>
                        <Text style={[styles.levelText, { color: aura?.color || theme.colors.primary }]}>
                            LEVEL {Math.floor((moodHistory?.length || 0) / 5) + 1} • {aura?.name || "Neutral"} Bloom
                        </Text>
                    </View>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsRow}>
                    <Card isDark={isDark} style={[styles.statCard, { marginRight: theme.spacing.md }]} intensity={isDark ? 40 : 80}>
                        <Text style={[styles.statValue, { color: theme.colors.primary }]}>{moodHistory?.length || 0}</Text>
                        <Text style={[styles.statLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Check-ins</Text>
                    </Card>
                    <Card isDark={isDark} style={styles.statCard} intensity={isDark ? 40 : 80}>
                        <Text style={[styles.statValue, { color: theme.colors.accent }]}>{journalEntries?.length || 0}</Text>
                        <Text style={[styles.statLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Journals</Text>
                    </Card>
                </View>

                {/* App Settings Section */}
                <Text style={[styles.sectionTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Settings</Text>
                
                <Card isDark={isDark} style={styles.settingsCard} intensity={isDark ? 40 : 80} noPadding>
                    <View style={styles.settingsInner}>
                        <SettingItem 
                            icon={<Feather name="bell" color={theme.colors.primary} size={20} />}
                            title="Reminders"
                            desc="Daily mindfulness pings"
                            right={<Switch value={settings?.notifications} onValueChange={toggleNotifications} trackColor={{ true: theme.colors.primary }} />}
                            isDark={isDark}
                        />
                        <Divider isDark={isDark} />
                        <SettingItem 
                            icon={settings?.theme === 'dark' ? <Feather name="moon" color={theme.colors.secondary} size={20} /> : (settings?.theme === 'light' ? <Feather name="sun" color={theme.colors.warning} size={20} /> : <Feather name="monitor" color={theme.colors.accent} size={20} />)}
                            title="Interface"
                            desc={settings?.theme === 'dark' ? "Always Dark" : (settings?.theme === 'light' ? "Always Light" : "Follow System")}
                            right={<Text style={styles.cycleLabel}>CYCLE</Text>}
                            onPress={cycleTheme}
                            isDark={isDark}
                        />
                        <Divider isDark={isDark} />
                        <SettingItem 
                            icon={<Feather name="key" color={theme.colors.warning} size={20} />}
                            title="Password"
                            desc="Update security code"
                            right={<Text style={[styles.actionLabel, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>RESET</Text>}
                            onPress={handleTriggerReset}
                            isDark={isDark}
                        />
                        <Divider isDark={isDark} />
                        <SettingItem 
                            icon={<Feather name="trash-2" color={theme.colors.danger} size={20} />}
                            title="Identity"
                            desc="Clear all local data"
                            right={<Text style={[styles.actionLabel, { color: theme.colors.danger }]}>WIPE</Text>}
                            onPress={() => setShowWipeConfirm(true)}
                            isDark={isDark}
                        />
                    </View>
                </Card>

                <TouchableOpacity style={[styles.signOutBtn, { borderColor: theme.colors.danger + '44', backgroundColor: theme.colors.danger + '11' }]} onPress={handleSignOut} activeOpacity={0.8}>
                    <Feather name="log-out" color={theme.colors.danger} size={20} style={{ marginRight: 12 }} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>AURA PREMIUM V1.2 • 2026</Text>
            </ScrollView>

            {/* Wipe Data Modal */}
            <Modal visible={showWipeConfirm} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <Card isDark={isDark} style={styles.modalCard} intensity={90}>
                        <Feather name="shield" size={60} color={theme.colors.danger} style={{ marginBottom: theme.spacing.md }} />
                        <Text style={[styles.modalTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Erase everything?</Text>
                        <Text style={[styles.modalDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                            This permanently deletes your journals and mood history. Cannot be undone.
                        </Text>
                        <View style={styles.modalButtons}>
                            <Button variant="danger" fullWidth onPress={handleWipe}>Erase All</Button>
                            <Button variant="outline" fullWidth onPress={() => setShowWipeConfirm(false)} style={{ marginTop: theme.spacing.sm }}>Cancel</Button>
                        </View>
                    </Card>
                </View>
            </Modal>

            {/* Password Reset Modal */}
            <Modal visible={showResetModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <Card isDark={isDark} style={styles.modalCard} intensity={90}>
                        <Text style={styles.modalEmoji}>📬</Text>
                        <Text style={[styles.modalTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Security Code</Text>
                        <Text style={[styles.modalDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>We sent a code to your email.</Text>
                        
                        <View style={styles.resetInputs}>
                            <TextInput 
                                placeholder="4-digit code"
                                placeholderTextColor={theme.dark.textSub}
                                value={otp}
                                onChangeText={setOtp}
                                maxLength={4}
                                keyboardType="number-pad"
                                style={[styles.otpInput, { color: isDark ? theme.dark.textMain : theme.light.textMain, backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary, marginBottom: theme.spacing.md }]}
                            />
                            <TextInput 
                                placeholder="New Password"
                                placeholderTextColor={theme.dark.textSub}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                                style={[styles.passInput, { color: isDark ? theme.dark.textMain : theme.light.textMain, backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary }]}
                            />
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <View style={styles.modalButtons}>
                            <Button fullWidth onPress={handleFinishReset} isLoading={isLoading}>Update</Button>
                            <Button variant="outline" fullWidth onPress={() => { setShowResetModal(false); setError(""); }} style={{ marginTop: theme.spacing.sm }}>Cancel</Button>
                        </View>
                    </Card>
                </View>
            </Modal>
        </SafeScreen>
    );
}

function SettingItem({ icon, title, desc, right, onPress, isDark }) {
    return (
        <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
            <View style={[styles.settingIcon, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.border }]}>
                {icon}
            </View>
            <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{title}</Text>
                <Text style={[styles.settingDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{desc}</Text>
            </View>
            {right}
        </TouchableOpacity>
    );
}

const Divider = ({ isDark }) => <View style={[styles.divider, { backgroundColor: isDark ? theme.dark.border : theme.light.border }]} />;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
    },
    backButton: {
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
        padding: theme.spacing.lg,
    },
    identityCard: {
        alignItems: 'center',
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.xl,
    },
    avatarWrapper: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    auraCircle: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        opacity: 0.2,
    },
    avatarMain: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    avatarEmoji: {
        fontSize: 48,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingHorizontal: 10,
    },
    nameTouch: {
        maxWidth: '80%',
        marginRight: theme.spacing.sm,
    },
    userName: {
        ...theme.typography.h1,
        textAlign: 'center',
    },
    nameInput: {
        ...theme.typography.h1,
        borderBottomWidth: 2,
        borderColor: theme.colors.primary,
        width: 220,
        textAlign: 'center',
        padding: 4,
        marginRight: theme.spacing.sm,
    },
    refreshBtn: {
        padding: 10,
        borderRadius: 12,
    },
    levelBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.md,
    },
    levelText: {
        ...theme.typography.caption,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.xl,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: theme.spacing.lg,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '900',
        marginBottom: 4,
    },
    statLabel: {
        ...theme.typography.caption,
    },
    sectionTitle: {
        ...theme.typography.caption,
        marginBottom: theme.spacing.md,
        opacity: 0.6,
        marginLeft: 8,
    },
    settingsCard: {
        padding: 0,
    },
    settingsInner: {
        paddingVertical: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    settingIcon: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    settingText: {
        flex: 1,
    },
    settingTitle: {
        ...theme.typography.subtitle,
    },
    settingDesc: {
        fontSize: 13,
        opacity: 0.7,
        marginTop: 2,
    },
    cycleLabel: {
        ...theme.typography.caption,
        backgroundColor: theme.colors.primary,
        color: '#000',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
    },
    actionLabel: {
        ...theme.typography.caption,
        backgroundColor: 'rgba(120,120,120,0.1)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        overflow: 'hidden',
    },
    divider: {
        height: 1,
        marginHorizontal: theme.spacing.lg,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        borderWidth: 1,
        marginTop: theme.spacing.xl,
    },
    signOutText: {
        color: theme.colors.danger,
        ...theme.typography.subtitle,
    },
    versionText: {
        textAlign: 'center',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
        ...theme.typography.caption,
        opacity: 0.3,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.lg,
    },
    modalCard: {
        width: '100%',
        maxWidth: 360,
        padding: theme.spacing.xl,
        alignItems: 'center',
        borderRadius: theme.borderRadius.xl,
    },
    modalEmoji: {
        fontSize: 48,
        marginBottom: theme.spacing.md,
    },
    modalTitle: {
        ...theme.typography.h2,
        marginBottom: theme.spacing.xs,
        textAlign: 'center',
    },
    modalDesc: {
        ...theme.typography.body,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    modalButtons: {
        width: '100%',
    },
    resetInputs: {
        width: '100%',
        marginBottom: theme.spacing.lg,
    },
    otpInput: {
        width: '100%',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 8,
        textAlign: 'center',
    },
    passInput: {
        width: '100%',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        ...theme.typography.subtitle,
    },
    errorText: {
        color: theme.colors.danger,
        ...theme.typography.body,
        marginBottom: theme.spacing.md,
        fontWeight: '700',
    }
});
