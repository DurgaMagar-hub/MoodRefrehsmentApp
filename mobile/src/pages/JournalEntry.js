import React, { useState, useContext, useEffect, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    ScrollView, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    Alert,
    Dimensions,
    BackHandler
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { Feather } from '@expo/vector-icons';
import Card from '../components/Card';
import Button from '../components/Button';

const { width } = Dimensions.get('window');

export default function JournalEntryScreen({ route, navigation }) {
    const { id } = route?.params || {};
    const { addJournalEntry, updateJournalEntry, journalEntries, isDarkTheme } = useContext(MoodContext);
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [mood, setMood] = useState("✨");
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [styleState, setStyleState] = useState({
        font: 'body',
        size: 17,
        color: 'auto',
        align: 'left',
        bold: false,
        italic: false,
        underline: false,
        theme: 'auto', // page theme: auto | airy | night | nature
    });

    const moods = ["✨", "🌈", "☀️", "☁️", "🌧️", "🌙"];

    useEffect(() => {
        if (id) {
            const existingEntry = journalEntries.find(e => e.id === Number(id));
            if (existingEntry) {
                setTitle(existingEntry.title);
                setContent(existingEntry.content);
                setMood(existingEntry.mood || "✨");
                if (existingEntry.style) {
                    try {
                        const parsed = typeof existingEntry.style === 'string' ? JSON.parse(existingEntry.style) : existingEntry.style;
                        if (parsed && typeof parsed === 'object') setStyleState((prev) => ({ ...prev, ...parsed }));
                    } catch (_) {}
                }
            }
        }
    }, [id]);

    const hasUnsavedChanges = () => {
        if (id) {
            const existingEntry = journalEntries.find(e => e.id === Number(id));
            if (!existingEntry) return false;
            const prevStyle = existingEntry.style;
            const prevStyleKey = typeof prevStyle === 'string' ? prevStyle : JSON.stringify(prevStyle || {});
            const currentStyleKey = JSON.stringify(styleState || {});
            return title !== existingEntry.title || content !== existingEntry.content || mood !== existingEntry.mood || prevStyleKey !== currentStyleKey;
        }
        return title.trim() !== "" || content.trim() !== "";
    };

    const handleBack = () => {
        if (hasUnsavedChanges()) {
            Alert.alert(
                "Unsaved Changes",
                "You have unsaved reflections. Do you want to discard them?",
                [
                    { text: "Keep Writing", style: "cancel" },
                    { text: "Discard", style: "destructive", onPress: () => navigation.goBack() }
                ]
            );
        } else {
            navigation.goBack();
        }
    };

    useEffect(() => {
        const backAction = () => {
            if (hasUnsavedChanges()) {
                handleBack();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [title, content, mood]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert("Title Missing", "Please give your reflection a title.");
            return;
        }

        try {
            if (id) {
                await updateJournalEntry(id, { title, content, mood, style: styleState });
            } else {
                await addJournalEntry({ title, content, mood, style: styleState });
            }
            navigation.goBack();
        } catch (_) {
            Alert.alert("Couldn’t save", "Your entry could not be saved. Please make sure the server is running, then try again.");
        }
    };

    const isDark = isDarkTheme;

    const pageBg = useMemo(() => {
        const t = styleState.theme;
        if (t === 'night') return isDark ? 'rgba(8,18,30,0.65)' : 'rgba(8,18,30,0.14)';
        if (t === 'nature') return isDark ? 'rgba(12,30,22,0.62)' : 'rgba(230, 250, 240, 0.60)';
        if (t === 'airy') return isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)';
        return isDark ? theme.colors.glassDark : theme.light.card;
    }, [styleState.theme, isDark]);

    const textColor = useMemo(() => {
        if (styleState.color === 'auto') return isDark ? theme.dark.textMain : theme.light.textMain;
        return styleState.color;
    }, [styleState.color, isDark]);

    const fontMap = {
        body: theme.fontFamily.body,
        bodyMedium: theme.fontFamily.bodyMedium,
        display: theme.fontFamily.displayMedium,
    };

    const editorTextStyle = useMemo(
        () => ({
            fontSize: styleState.size,
            fontFamily: fontMap[styleState.font] || theme.fontFamily.body,
            color: textColor,
            textAlign: styleState.align,
            fontWeight: styleState.bold ? '800' : '500',
            fontStyle: styleState.italic ? 'italic' : 'normal',
            textDecorationLine: styleState.underline ? 'underline' : 'none',
        }),
        [styleState, textColor]
    );

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.flex}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity 
                        onPress={handleBack} 
                        style={[styles.backBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="chevron-left" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
                        {id ? "Refine Thought" : "New Reflection"}
                    </Text>
                    <TouchableOpacity 
                        onPress={handleSave} 
                        disabled={!title.trim()} 
                        style={[styles.saveBtn, { backgroundColor: title.trim() ? theme.colors.primary : (isDark ? '#333' : '#eee') }]}
                    >
                        <Feather name="check" size={20} color={title.trim() ? "#fff" : (isDark ? '#555' : '#aaa')} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Title Input */}
                    <TextInput 
                        style={[styles.titleInput, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                        placeholder="Untitled Reflection"
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                        value={title}
                        onChangeText={setTitle}
                        multiline={false}
                    />

                    {/* Mood Selector */}
                    <View style={styles.moodContainer}>
                        <View style={[styles.moodPills, { backgroundColor: isDark ? theme.colors.glassDark : '#f0f0f5' }]}>
                            {moods.map(m => (
                                <TouchableOpacity 
                                    key={m} 
                                    style={[styles.moodPill, mood === m && (isDark ? styles.moodPillActiveDark : styles.moodPillActiveLight)]} 
                                    onPress={() => setMood(m)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.moodText, mood === m && styles.moodTextActive]}>{m}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Text Customizer Toggle */}
                    <View style={styles.customizerBar}>
                        <TouchableOpacity
                            onPress={() => setShowCustomizer((s) => !s)}
                            activeOpacity={0.85}
                            style={[styles.customizerBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary, borderColor: isDark ? theme.dark.border : theme.light.border }]}
                        >
                            <Feather name="sliders" size={18} color={isDark ? theme.dark.textMain : theme.light.textMain} />
                            <Text style={[styles.customizerBtnText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                                Text style
                            </Text>
                            <Feather name={showCustomizer ? "chevron-up" : "chevron-down"} size={18} color={isDark ? theme.dark.textSub : theme.light.textSub} />
                        </TouchableOpacity>
                    </View>

                    {showCustomizer ? (
                        <Card isDark={isDark} style={styles.customizerCard} intensity={isDark ? 30 : 70}>
                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>Font</Text>
                            <View style={styles.pillRow}>
                                {[
                                    { id: 'body', label: 'Clean' },
                                    { id: 'bodyMedium', label: 'Bold' },
                                    { id: 'display', label: 'Serif' },
                                ].map((opt) => {
                                    const active = styleState.font === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            onPress={() => setStyleState((s) => ({ ...s, font: opt.id }))}
                                            style={[styles.pill, { backgroundColor: active ? theme.colors.primary + '22' : 'transparent', borderColor: active ? theme.colors.primary : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            <Text style={[styles.pillText, { color: isDark ? theme.dark.textMain : theme.light.textMain, opacity: active ? 1 : 0.7 }]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Size</Text>
                            <View style={styles.pillRow}>
                                {[15, 17, 19, 22].map((sz) => {
                                    const active = styleState.size === sz;
                                    return (
                                        <TouchableOpacity
                                            key={sz}
                                            onPress={() => setStyleState((s) => ({ ...s, size: sz }))}
                                            style={[styles.pill, { backgroundColor: active ? theme.colors.secondary + '22' : 'transparent', borderColor: active ? theme.colors.secondary : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            <Text style={[styles.pillText, { color: isDark ? theme.dark.textMain : theme.light.textMain, opacity: active ? 1 : 0.7 }]}>
                                                {sz}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Color</Text>
                            <View style={styles.pillRow}>
                                {[
                                    { id: 'auto', swatch: null, label: 'Auto' },
                                    { id: '#142033', swatch: '#142033', label: 'Ink' },
                                    { id: '#2a6fdb', swatch: '#2a6fdb', label: 'Blue' },
                                    { id: '#1f9d78', swatch: '#1f9d78', label: 'Green' },
                                    { id: '#d14b8f', swatch: '#d14b8f', label: 'Pink' },
                                ].map((opt) => {
                                    const active = styleState.color === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            onPress={() => setStyleState((s) => ({ ...s, color: opt.id }))}
                                            style={[styles.pill, { backgroundColor: active ? theme.colors.accent + '22' : 'transparent', borderColor: active ? theme.colors.accent : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            {opt.swatch ? <View style={[styles.swatch, { backgroundColor: opt.swatch }]} /> : null}
                                            <Text style={[styles.pillText, { color: isDark ? theme.dark.textMain : theme.light.textMain, opacity: active ? 1 : 0.7 }]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Alignment</Text>
                            <View style={styles.pillRow}>
                                {[
                                    { id: 'left', icon: 'align-left' },
                                    { id: 'center', icon: 'align-center' },
                                    { id: 'right', icon: 'align-right' },
                                ].map((opt) => {
                                    const active = styleState.align === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            onPress={() => setStyleState((s) => ({ ...s, align: opt.id }))}
                                            style={[styles.iconPill, { backgroundColor: active ? theme.colors.primary + '22' : 'transparent', borderColor: active ? theme.colors.primary : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            <Feather name={opt.icon} size={16} color={isDark ? theme.dark.textMain : theme.light.textMain} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Style</Text>
                            <View style={styles.pillRow}>
                                {[
                                    { key: 'bold', label: 'Bold' },
                                    { key: 'italic', label: 'Italic' },
                                    { key: 'underline', label: 'Underline' },
                                ].map((opt) => {
                                    const active = !!styleState[opt.key];
                                    return (
                                        <TouchableOpacity
                                            key={opt.key}
                                            onPress={() => setStyleState((s) => ({ ...s, [opt.key]: !s[opt.key] }))}
                                            style={[styles.pill, { backgroundColor: active ? theme.colors.secondary + '22' : 'transparent', borderColor: active ? theme.colors.secondary : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            <Text style={[styles.pillText, { color: isDark ? theme.dark.textMain : theme.light.textMain, opacity: active ? 1 : 0.7 }]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Page</Text>
                            <View style={styles.pillRow}>
                                {[
                                    { id: 'auto', label: 'Auto' },
                                    { id: 'airy', label: 'Airy' },
                                    { id: 'night', label: 'Night' },
                                    { id: 'nature', label: 'Nature' },
                                ].map((opt) => {
                                    const active = styleState.theme === opt.id;
                                    return (
                                        <TouchableOpacity
                                            key={opt.id}
                                            onPress={() => setStyleState((s) => ({ ...s, theme: opt.id }))}
                                            style={[styles.pill, { backgroundColor: active ? theme.colors.accent + '22' : 'transparent', borderColor: active ? theme.colors.accent : (isDark ? theme.dark.border : theme.light.border) }]}
                                        >
                                            <Text style={[styles.pillText, { color: isDark ? theme.dark.textMain : theme.light.textMain, opacity: active ? 1 : 0.7 }]}>
                                                {opt.label}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Text style={[styles.customizerLabel, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginTop: 12 }]}>Stickers</Text>
                            <View style={styles.pillRow}>
                                {['✨', '🌿', '⭐', '💛', '🌸', '🫧'].map((em) => (
                                    <TouchableOpacity
                                        key={em}
                                        onPress={() => setContent((c) => (c ? `${c} ${em}` : em))}
                                        style={[styles.iconPill, { borderColor: isDark ? theme.dark.border : theme.light.border }]}
                                    >
                                        <Text style={{ fontSize: 16 }}>{em}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card>
                    ) : null}

                    {/* Content Editor */}
                    <Card isDark={isDark} style={[styles.editorCard, { backgroundColor: pageBg }]} intensity={isDark ? 40 : 80}>
                        <TextInput 
                            style={[styles.contentInput, editorTextStyle]}
                            placeholder="Start writing..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                            scrollEnabled={false}
                        />
                    </Card>
                </ScrollView>
            </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.soft,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
    },
    saveBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        padding: theme.spacing.lg,
    },
    summaryCard: {
        marginTop: theme.spacing.md,
        padding: theme.spacing.lg,
    },
    summaryLabel: {
        ...theme.typography.caption,
        marginBottom: 8,
    },
    summaryText: {
        ...theme.typography.body,
        lineHeight: 22,
    },
    summaryHint: {
        ...theme.typography.small,
        marginTop: 12,
        fontStyle: 'italic',
    },
    titleInput: {
        fontSize: 32,
        fontWeight: '900',
        letterSpacing: -1.5,
        marginBottom: 24,
    },
    moodContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    moodPills: {
        flexDirection: 'row',
        padding: 6,
        borderRadius: 30,
    },
    moodPill: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 3, // Replaces gap
    },
    moodPillActiveLight: {
        backgroundColor: '#fff',
        ...theme.shadows.soft,
    },
    moodPillActiveDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    moodText: {
        fontSize: 22,
        opacity: 0.4,
    },
    moodTextActive: {
        opacity: 1,
        transform: [{ scale: 1.2 }],
    },
    editorCard: {
        padding: 24,
        borderRadius: 32,
        minHeight: 400,
        marginBottom: 40,
    },
    contentInput: {
        lineHeight: 26,
        flex: 1,
    }
    ,
    customizerBar: {
        marginBottom: 12,
    },
    customizerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 18,
        borderWidth: 1,
    },
    customizerBtnText: {
        ...theme.typography.subtitle,
        flex: 1,
        marginLeft: 10,
    },
    customizerCard: {
        padding: 18,
        borderRadius: 24,
        marginBottom: 18,
    },
    customizerLabel: {
        ...theme.typography.caption,
        marginBottom: 10,
    },
    pillRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    pill: {
        width: '48%',
        borderWidth: 1,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconPill: {
        width: 44,
        height: 40,
        borderWidth: 1,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: 'transparent',
    },
    pillText: {
        fontSize: 13,
        fontWeight: '800',
    },
    swatch: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
});
