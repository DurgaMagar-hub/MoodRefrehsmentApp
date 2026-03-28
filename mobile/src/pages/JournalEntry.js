import React, { useState, useContext, useEffect } from 'react';
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
import { summarizeJournalText } from '../utils/moodAnalytics';

const { width } = Dimensions.get('window');

export default function JournalEntryScreen({ route, navigation }) {
    const { id } = route?.params || {};
    const { addJournalEntry, updateJournalEntry, journalEntries, isDarkTheme } = useContext(MoodContext);
    
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [mood, setMood] = useState("✨");
    const [reflectionSummary, setReflectionSummary] = useState("");

    const moods = ["✨", "🌈", "☀️", "☁️", "🌧️", "🌙"];

    useEffect(() => {
        if (id) {
            const existingEntry = journalEntries.find(e => e.id === Number(id));
            if (existingEntry) {
                setTitle(existingEntry.title);
                setContent(existingEntry.content);
                setMood(existingEntry.mood || "✨");
            }
        }
    }, [id]);

    useEffect(() => {
        const t = setTimeout(() => {
            if (content.trim().length > 24) setReflectionSummary(summarizeJournalText(content));
            else setReflectionSummary("");
        }, 550);
        return () => clearTimeout(t);
    }, [content]);

    const hasUnsavedChanges = () => {
        if (id) {
            const existingEntry = journalEntries.find(e => e.id === Number(id));
            if (!existingEntry) return false;
            return title !== existingEntry.title || content !== existingEntry.content || mood !== existingEntry.mood;
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

    const handleSave = () => {
        if (!title.trim()) {
            Alert.alert("Title Missing", "Please give your reflection a title.");
            return;
        }

        if (id) {
            updateJournalEntry(id, { title, content, mood });
        } else {
            addJournalEntry({ title, content, mood });
        }
        navigation.goBack();
    };

    const isDark = isDarkTheme;

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

                    {/* Content Editor */}
                    <Card isDark={isDark} style={styles.editorCard} intensity={isDark ? 40 : 80}>
                        <TextInput 
                            style={[styles.contentInput, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}
                            placeholder="Start writing..."
                            placeholderTextColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                            value={content}
                            onChangeText={setContent}
                            multiline
                            textAlignVertical="top"
                            scrollEnabled={false}
                        />
                    </Card>

                    {reflectionSummary ? (
                        <Card isDark={isDark} style={styles.summaryCard} intensity={isDark ? 30 : 70}>
                            <Text style={[styles.summaryLabel, { color: theme.colors.secondary }]}>Reflection snapshot</Text>
                            <Text style={[styles.summaryText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                                {reflectionSummary}
                            </Text>
                            <Text style={[styles.summaryHint, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                                On-device summary — connect an AI service later for deeper coaching.
                            </Text>
                        </Card>
                    ) : null}
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
        fontSize: 17,
        lineHeight: 26,
        fontWeight: '500',
        flex: 1,
    }
});
