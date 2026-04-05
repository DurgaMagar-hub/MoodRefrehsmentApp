import React, { useState, useContext, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Image,
    Alert,
    Keyboard
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import Constants from 'expo-constants';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';
import { KeyRound, Sparkles } from 'lucide-react-native';
import api from '../utils/api';
import { testConnection } from '../utils/debug';
import { GOOGLE_WEB_CLIENT_ID } from '../config';


export default function LoginScreen({ navigation }) {
    const context = useContext(MoodContext);
    if (!context) {
        return <SafeScreen style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Missing MoodContext Provider!</Text></SafeScreen>;
    }

    const { login, accounts, setAccounts, isDarkTheme } = context;
    const isDark = isDarkTheme;

    const [mode, setMode] = useState('login');
    const [signupStep, setSignupStep] = useState('details');
    const [resetStep, setResetStep] = useState('email');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [focusedField, setFocusedField] = useState(null);

    // Test connection on mount
    useEffect(() => {
        testConnection().then(result => {
            if (!result.success) {
                console.warn('API connection test failed. Check your server is running.');
            }
        });
    }, []);

    // Dismiss keyboard when switching modes
    useEffect(() => {
        Keyboard.dismiss();
    }, [mode]);

    const nativeGoogleReady = Platform.OS !== 'web' && Constants.appOwnership !== 'expo';

    useEffect(() => {
        if (!nativeGoogleReady || !GOOGLE_WEB_CLIENT_ID) return;
        try {
            GoogleSignin.configure({
                webClientId: GOOGLE_WEB_CLIENT_ID.replace(/\s+/g, ''),
                offlineAccess: false,
            });
        } catch (e) {
            console.warn('GoogleSignin.configure:', e);
        }
    }, [nativeGoogleReady, GOOGLE_WEB_CLIENT_ID]);

    const handleGoogleSuccess = async (accessToken) => {
        setIsLoading(true);
        setError("");
        try {
            const res = await api.post(`/auth/google-custom`, {
                access_token: accessToken
            });
            login(res.data);
            if (res.data.role === "admin") {
                navigation.replace('AdminDashboard');
            } else {
                navigation.replace('Home');
            }
        } catch (err) {
            setError("Google Authentication Failed 🦋");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    /** System account picker (Play Services / iOS) — no in-app browser. */
    const runGoogleSignIn = async () => {
        if (Platform.OS === 'web') {
            Alert.alert('Google sign-in', 'Use the mobile app for Google sign-in, or sign in with email here.');
            return;
        }
        if (Constants.appOwnership === 'expo') {
            Alert.alert(
                'Development build required',
                'Google’s native sign-in is not available in Expo Go. Run: npx expo run:android (or run:ios), then try again.'
            );
            return;
        }
        if (!GOOGLE_WEB_CLIENT_ID) {
            Alert.alert('Google not configured', 'Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env (your Web client id).');
            return;
        }
        setError('');
        try {
            if (Platform.OS === 'android') {
                await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            }
            const res = await GoogleSignin.signIn();
            if (res.type !== 'success') {
                return;
            }
            const tokens = await GoogleSignin.getTokens();
            if (!tokens.accessToken) {
                setError('Could not get a Google access token. Try again.');
                return;
            }
            await handleGoogleSuccess(tokens.accessToken);
        } catch (e) {
            if (e?.code === statusCodes.SIGN_IN_CANCELLED) {
                return;
            }
            if (e?.code === statusCodes.IN_PROGRESS) {
                return;
            }
            if (e?.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setError('Update Google Play Services to use Google sign-in.');
                return;
            }
            // Android code 10 / DEVELOPER_ERROR = Google Cloud mismatch (package, SHA-1, or wrong project).
            const msg = String(e?.message || '');
            const devErr =
                Platform.OS === 'android' &&
                (msg.includes('DEVELOPER_ERROR') || e?.code === 10 || String(e?.code) === '10');
            if (devErr) {
                setError('Google console mismatch (see alert).');
                Alert.alert(
                    'Fix Google Sign-In (DEVELOPER_ERROR)',
                        'Expo/React Native debug builds are signed with the project keystore\n' +
                        'mobile/android/app/debug.keystore — NOT ~/.android/debug.keystore.\n\n' +
                        '1) Run: npm run android:debug-sha (in the mobile folder)\n' +
                        '   or: keytool -list -v -keystore android/app/debug.keystore …\n' +
                        '2) Google Cloud → Credentials → your Android OAuth client:\n' +
                        '   Package: com.moodrefreshment.app\n' +
                        '   Add the SHA-1 (and SHA-256) from THAT keystore.\n' +
                        '3) Same GCP project as your Web client id; webClientId = Web client only.\n' +
                        '4) Save, wait ~10 min, adb uninstall com.moodrefreshment.app, npx expo run:android\n\n' +
                        'https://react-native-google-signin.github.io/docs/troubleshooting'
                );
                return;
            }
            console.error('Google sign-in:', e);
            setError('Google sign-in failed. Try again.');
        }
    };

    const handleLogin = async () => {
        setError("");
        if (!email || !password) {
            setError("Please fill your space ✨");
            return;
        }

        setIsLoading(true);
        try {
            // First try to find in local accounts (for faster login)
            const existingAccount = accounts.find(a => a.email === email && a.password === password);

            if (existingAccount) {
                login(existingAccount);
                if (existingAccount.role === "admin") {
                    navigation.replace('AdminDashboard');
                } else {
                    navigation.replace('Home');
                }
            } else {
                // If not found locally, check if server has any accounts with this email
                // This handles cases where accounts exist but weren't loaded yet
                const serverAccounts = await api.get(`/users`);
                const serverAccount = serverAccounts.data.find(a => a.email === email && a.password === password);

                if (serverAccount) {
                    // Update local accounts and login
                    setAccounts(prev => [...prev, serverAccount]);
                    login(serverAccount);
                    if (serverAccount.role === "admin") {
                        navigation.replace('AdminDashboard');
                    } else {
                        navigation.replace('Home');
                    }
                } else {
                    setError("We couldn't find your light 🦋");
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Connection error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUpRequest = async () => {
        if (!email || !password || password.length < 6) {
            setError("Valid email and 6+ char password required 🔐");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            // Check if email already exists on server
            const serverAccounts = await api.get(`/users`);
            const exists = serverAccounts.data.find(a => a.email === email);

            if (exists) {
                setError("Email already registered");
                return;
            }

            await api.post(`/auth/send-otp`, { email });
            setSignupStep('otp');
        } catch (err) {
            setError(err.response?.data?.error || "Error sending code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifySignup = async () => {
        if (otp.length < 4) return;
        setIsLoading(true);
        setError("");
        try {
            const res = await api.post(`/auth/verify-otp`, { email, password, otp });
            const newAccount = res.data;

            // Update local accounts state
            setAccounts(prev => [...prev, newAccount]);
            login(newAccount);
            navigation.replace('Home');
        } catch (err) {
            setError(err.response?.data?.error || "Invalid code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetRequest = async () => {
        if (!email) {
            setError("Enter email to find your space 📬");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await api.post(`/auth/forgot-password`, { email });
            setResetStep('otp');
        } catch (err) {
            setError(err.response?.data?.error || "Error sending code");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishReset = async () => {
        if (otp.length < 4 || newPassword.length < 6) {
            setError("Fill all fields correctly 🔐");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await api.post(`/auth/reset-password`, { email, otp, newPassword });
            setMode('login');
            setPassword(newPassword);
            setError("Password updated. You can sign in now.");
        } catch (err) {
            setError(err.response?.data?.error || "Error resetting password");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeScreen style={styles.container}>
            <Animated.ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                maintainVisibleContentPosition={{ minIndexForVisible: 0, autoscrollToTopThreshold: 10 }}
            >

                <View style={styles.header}>
                    <Text style={[styles.headerGreeting, { color: isDark ? theme.colors.accent : theme.colors.secondary }]}>
                        {mode === 'login' ? "Welcome" : (mode === 'signup' ? "Create your space" : "Reset access")}
                    </Text>
                    <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                        {mode === 'login' ? "Take a calm breath in." : (mode === 'signup' ? "Start gently, one step at a time." : "We’ll help you get back in.")}
                    </Text>
                </View>

                <Card isDark={isDark} style={styles.authCard} intensity={isDark ? 30 : 70} noPadding>
                    <View style={styles.cardInner}>
                        {mode !== 'reset' && (
                            <View
                                style={[
                                    styles.tabs,
                                    {
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : theme.colors.primary + '14',
                                    },
                                ]}
                            >
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'login' && [styles.activeTab, { backgroundColor: isDark ? theme.dark.cardSolid : 'rgba(255,255,255,0.92)' }]]}
                                    onPress={() => { setMode('login'); setError(""); }}
                                >
                                    <View
                                        style={[
                                            styles.tabIconBadge,
                                            {
                                                backgroundColor:
                                                    mode === 'login'
                                                        ? (isDark ? 'rgba(129,230,180,0.18)' : theme.colors.secondary + '24')
                                                        : isDark
                                                          ? 'rgba(255,255,255,0.06)'
                                                          : 'rgba(0,0,0,0.05)',
                                            },
                                        ]}
                                    >
                                        <KeyRound
                                            size={17}
                                            color={
                                                mode === 'login'
                                                    ? theme.colors.secondary
                                                    : isDark
                                                      ? theme.dark.textSub
                                                      : theme.light.textSub
                                            }
                                            strokeWidth={2.25}
                                        />
                                    </View>
                                    <Text style={[styles.tabText, { color: mode === 'login' ? (isDark ? theme.dark.textMain : theme.light.textMain) : theme.light.textSub }]}>Sign In</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.tab, mode === 'signup' && [styles.activeTab, { backgroundColor: isDark ? theme.dark.cardSolid : 'rgba(255,255,255,0.92)' }]]}
                                    onPress={() => { setMode('signup'); setError(""); }}
                                >
                                    <View
                                        style={[
                                            styles.tabIconBadge,
                                            {
                                                backgroundColor:
                                                    mode === 'signup'
                                                        ? (isDark ? 'rgba(192,132,252,0.2)' : theme.colors.primary + '22')
                                                        : isDark
                                                          ? 'rgba(255,255,255,0.06)'
                                                          : 'rgba(0,0,0,0.05)',
                                            },
                                        ]}
                                    >
                                        <Sparkles
                                            size={17}
                                            color={
                                                mode === 'signup'
                                                    ? theme.colors.primary
                                                    : isDark
                                                      ? theme.dark.textSub
                                                      : theme.light.textSub
                                            }
                                            strokeWidth={2.25}
                                        />
                                    </View>
                                    <Text style={[styles.tabText, { color: mode === 'signup' ? (isDark ? theme.dark.textMain : theme.light.textMain) : theme.light.textSub }]}>Join</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {mode === 'login' && (
                            <View style={styles.formContainer}>
                                <View style={[
                                    styles.inputWrapper,
                                    isDark ? styles.inputShellDark : styles.inputShellLight,
                                ]}>
                                    <Feather name="mail" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                    <TextInput
                                        placeholder="Email address"
                                        placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                        style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        autoCapitalize="none"
                                        keyboardType="email-address"
                                        autoComplete="email"
                                        textContentType="emailAddress"
                                    />
                                </View>

                                <View style={[
                                    styles.inputWrapper,
                                    isDark ? styles.inputShellDark : styles.inputShellLight,
                                ]}>
                                    <Feather name="lock" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                    <TextInput
                                        placeholder="Password"
                                        placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                        style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoComplete="password"
                                        textContentType="password"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Feather name="eye-off" size={20} color={theme.dark.textSub} /> : <Feather name="eye" size={20} color={theme.dark.textSub} />}
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity onPress={() => setMode('reset')} style={styles.forgotPassContainer}>
                                    <Text style={[styles.forgotPass, { color: theme.colors.primary }]}>Forgot Password?</Text>
                                </TouchableOpacity>

                                <Button fullWidth onPress={handleLogin} isLoading={isLoading} style={styles.submitBtn}>
                                    Sign In
                                </Button>

                                <View style={styles.dividerRow}>
                                    <View style={[styles.dividerLine, { backgroundColor: isDark ? theme.dark.border : theme.light.border }]} />
                                    <Text style={[styles.dividerText, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>OR</Text>
                                    <View style={[styles.dividerLine, { backgroundColor: isDark ? theme.dark.border : theme.light.border }]} />
                                </View>

                                <TouchableOpacity
                                    style={[styles.googleBtn, isDark ? styles.googleBtnDark : styles.googleBtnLight]}
                                    onPress={() => {
                                        if (isLoading) return;
                                        runGoogleSignIn();
                                    }}
                                    disabled={isLoading}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.googleIconContainer}>
                                        <Image
                                            source={require('../../assets/google-g-logo.png')}
                                            style={styles.googleIcon}
                                            resizeMode="contain"
                                            accessibilityLabel="Google"
                                        />
                                    </View>
                                    <Text style={[styles.googleText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Continue with Google</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {mode === 'signup' && (
                            <View style={styles.formContainer}>
                                {signupStep === 'details' ? (
                                    <>
                                        <View style={[styles.inputWrapper, isDark ? styles.inputShellDark : styles.inputShellLight]}>
                                            <Feather name="mail" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                            <TextInput
                                                placeholder="Email address"
                                                placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                                style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                keyboardType="email-address"
                                                autoComplete="email"
                                                textContentType="emailAddress"
                                            />
                                        </View>
                                        <View style={[styles.inputWrapper, isDark ? styles.inputShellDark : styles.inputShellLight]}>
                                            <Feather name="lock" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                            <TextInput
                                                placeholder="Create password"
                                                placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                                style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry={!showPassword}
                                                autoComplete="password"
                                                textContentType="newPassword"
                                            />
                                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                                {showPassword ? <Feather name="eye-off" size={20} color={theme.dark.textSub} /> : <Feather name="eye" size={20} color={theme.dark.textSub} />}
                                            </TouchableOpacity>
                                        </View>
                                        <Button fullWidth onPress={handleSignUpRequest} isLoading={isLoading} style={styles.submitBtn}>
                                            Continue
                                        </Button>
                                    </>
                                ) : (
                                    <View style={styles.otpSection}>
                                        <Text style={[styles.otpLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Enter code sent to {email}</Text>
                                        <TextInput
                                            placeholder="----"
                                            placeholderTextColor={theme.dark.textSub}
                                            style={[styles.otpInput, isDark ? styles.inputShellDark : styles.inputShellLight, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                            value={otp}
                                            onChangeText={setOtp}
                                            maxLength={4}
                                            keyboardType="number-pad"
                                            onFocus={() => setFocusedField('signup-otp')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        <Button fullWidth onPress={handleVerifySignup} isLoading={isLoading}>Verify & Join</Button>
                                        <TouchableOpacity onPress={() => setSignupStep('details')} style={{ marginTop: 24 }}>
                                            <Text style={[styles.forgotPass, { color: theme.colors.primary }]}>Edit Details</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {mode === 'reset' && (
                            <View style={styles.formContainer}>
                                {resetStep === 'email' ? (
                                    <>
                                        <View style={[styles.inputWrapper, isDark ? styles.inputShellDark : styles.inputShellLight, focusedField === 'reset-email' && styles.inputWrapperFocused]}>
                                            <Feather name="mail" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                            <TextInput
                                                placeholder="Email address"
                                                placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                                style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                                value={email}
                                                onChangeText={setEmail}
                                                autoCapitalize="none"
                                                onFocus={() => setFocusedField('reset-email')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </View>
                                        <Button fullWidth onPress={handleResetRequest} isLoading={isLoading} style={styles.submitBtn}>Send Reset Code</Button>
                                        <TouchableOpacity onPress={() => setMode('login')} style={{ marginTop: 24, alignSelf: 'center' }}>
                                            <Text style={[styles.forgotPass, { color: theme.colors.primary }]}>Back to Sign In</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={styles.otpSection}>
                                        <TextInput
                                            placeholder="4-digit code"
                                            placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                            style={[styles.otpInput, isDark ? styles.inputShellDark : styles.inputShellLight, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                            value={otp}
                                            onChangeText={setOtp}
                                            maxLength={4}
                                            keyboardType="number-pad"
                                            onFocus={() => setFocusedField('reset-otp')}
                                            onBlur={() => setFocusedField(null)}
                                        />
                                        <View style={[styles.inputWrapper, isDark ? styles.inputShellDark : styles.inputShellLight, focusedField === 'reset-password' && styles.inputWrapperFocused, { marginBottom: 24 }]}>
                                            <Feather name="lock" size={20} color={isDark ? theme.dark.textSub : theme.light.textSub} style={styles.inputIcon} strokeWidth={1.35} />
                                            <TextInput
                                                placeholder="New Password"
                                                placeholderTextColor={isDark ? theme.dark.textSub : theme.light.textSub}
                                                style={[styles.input, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                                                value={newPassword}
                                                onChangeText={setNewPassword}
                                                secureTextEntry={!showPassword}
                                                onFocus={() => setFocusedField('reset-password')}
                                                onBlur={() => setFocusedField(null)}
                                            />
                                        </View>
                                        <Button fullWidth onPress={handleFinishReset} isLoading={isLoading} style={styles.submitBtn}>Update Password</Button>
                                        <TouchableOpacity onPress={() => setResetStep('email')} style={{ marginTop: 24 }}>
                                            <Text style={[styles.forgotPass, { color: theme.colors.primary }]}>Try another email</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}

                        {error ? (
                            <View style={[styles.errorBox, { backgroundColor: error.includes("Success") ? theme.colors.success + '22' : theme.colors.danger + '22' }]}>
                                <Text style={[styles.errorText, { color: error.includes("Success") ? theme.colors.success : theme.colors.danger }]}>{error}</Text>
                            </View>
                        ) : null}
                    </View>
                </Card>

            </Animated.ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
        flexGrow: 1,
        justifyContent: 'flex-start', // Changed from center to flex-start
        paddingTop: theme.spacing.xl, // Added top padding
    },
    header: {
        marginBottom: theme.spacing.xl,
        marginTop: theme.spacing.md, // Reduced top margin
    },
    headerGreeting: {
        ...theme.typography.caption,
        marginBottom: theme.spacing.xs,
    },
    title: {
        ...theme.typography.h1,
        marginTop: 4,
    },
    authCard: {
        borderRadius: theme.borderRadius.xl,
        ...theme.shadows.medium,
    },
    cardInner: {
        padding: theme.spacing.lg,
    },
    tabs: {
        flexDirection: 'row',
        padding: 8,
        borderRadius: theme.borderRadius.lg,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(168,85,247,0.12)',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: theme.borderRadius.md,
    },
    activeTab: {
        ...theme.shadows.soft,
    },
    tabText: {
        ...theme.typography.subtitle,
    },
    tabIconBadge: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    formContainer: {
        // REMOVED GAP specifically to ensure RN Yoga layout engine stability
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius.lg,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 14,
        minHeight: 58,
        marginBottom: theme.spacing.md,
        borderWidth: 1.5,
    },
    inputShellDark: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(255,255,255,0.12)',
    },
    inputShellLight: {
        backgroundColor: 'rgba(255,255,255,0.72)',
        borderColor: 'rgba(124,58,237,0.14)',
    },
    inputWrapperFocused: {
        borderColor: theme.colors.secondary,
        ...theme.shadows.glow(theme.colors.secondaryGlow),
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        ...theme.typography.body,
    },
    forgotPassContainer: {
        alignSelf: 'flex-end',
        paddingVertical: theme.spacing.xs,
        marginBottom: theme.spacing.md,
    },
    forgotPass: {
        ...theme.typography.subtitle,
    },
    submitBtn: {
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.md,
        marginBottom: theme.spacing.md, // ensuring safe margins
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        ...theme.typography.caption,
        paddingHorizontal: 16,
    },
    googleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: theme.borderRadius.lg,
        minHeight: 56,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
    },
    googleBtnDark: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderColor: 'rgba(240,171,252,0.22)',
    },
    googleBtnLight: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderColor: 'rgba(124,58,237,0.12)',
    },
    googleIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        marginRight: 12,
        overflow: 'hidden',
    },
    googleIcon: {
        width: 26,
        height: 26,
    },
    googleText: {
        ...theme.typography.subtitle,
    },
    errorBox: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.sm,
    },
    errorText: {
        ...theme.typography.body,
        textAlign: 'center',
    },
    otpSection: {
        alignItems: 'center',
    },
    otpLabel: {
        ...theme.typography.body,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    otpInput: {
        width: '100%',
        padding: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        fontSize: 32,
        fontFamily: theme.fontFamily.bodySemi,
        fontWeight: '600',
        letterSpacing: 12,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
        borderWidth: 1.5,
    }
});
