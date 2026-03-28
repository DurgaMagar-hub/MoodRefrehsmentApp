import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, ScrollView, BackHandler, Linking, Alert, Platform } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import Slider from '@react-native-community/slider';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';
import { isDistressMood } from '../utils/moodAnalytics';
import { trackEvent } from '../utils/analytics';

const { width } = Dimensions.get('window');

const moodSpectrum = [
    { label: "Peaceful", color: "#a29bfe", emoji: "😌", energyRange: [0, 40] },
    { label: "Gloomy", color: "#74b9ff", emoji: "😔", energyRange: [0, 30] },
    { label: "Calm", color: "#55efc4", emoji: "🌿", energyRange: [10, 50] },
    { label: "Stressed", color: "#fab1a0", emoji: "😫", energyRange: [60, 100] },
    { label: "Anxious", color: "#ffeaa7", emoji: "😰", energyRange: [50, 90] },
    { label: "Excited", color: "#fd79a8", emoji: "✨", energyRange: [70, 100] },
    { label: "Angry", color: "#ff7675", emoji: "😤", energyRange: [80, 100] },
    { label: "Content", color: "#81ecec", emoji: "☁️", energyRange: [30, 70] },
];

export default function MoodCheckScreen({ navigation }) {
    const { addMood, isDarkTheme } = useContext(MoodContext);
    
    const [step, setStep] = useState(1);
    const [energy, setEnergy] = useState(50);
    const [selectedMood, setSelectedMood] = useState(null);

    const fadeAnim = useRef(new Animated.Value(1)).current;

    const filteredMoods = moodSpectrum.filter(m =>
        energy >= m.energyRange[0] && energy <= m.energyRange[1]
    );

    useEffect(() => {
        const backAction = () => {
            if (step > 1) {
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
    }, [step]);

    const handleBack = () => {
        if (step > 1) {
            if (step === 4) {
                // If on final step, go directly to Home
                navigation.navigate('Home');
            } else {
                changeStep(step - 1);
            }
        } else {
            navigation.goBack();
        }
    };

    const changeStep = (newStep) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setStep(newStep);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start();
        });
    };

    const handleFinish = () => {
        if (selectedMood) {
            addMood({ ...selectedMood, energy });
            trackEvent('mood_logged', { label: selectedMood.label, energy });
            changeStep(4);
        }
    };

    const showCrisisResources = () => {
        trackEvent('crisis_resources_opened', {});
        if (Platform.OS === 'web') {
            window.open('https://988lifeline.org/', '_blank');
            return;
        }
        Alert.alert(
            'You deserve support',
            'If you might hurt yourself or others, seek help now. These are free, confidential US resources.',
            [
                { text: 'Call 988', onPress: () => Linking.openURL('tel:988') },
                { text: 'Crisis Text', onPress: () => Linking.openURL('sms:741741') },
                { text: 'Close', style: 'cancel' },
            ]
        );
    };

    const isDark = isDarkTheme;
    const activeBgColor = selectedMood ? `${selectedMood.color}15` : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)');
    const distress = step === 4 && selectedMood && isDistressMood({ label: selectedMood.label, energy });

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            {step < 4 && (
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={handleBack} 
                        style={[styles.backBtn, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="chevron-left" size={24} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>
                    <View style={styles.progressContainer}>
                        <View style={[styles.progressBar, { width: `${(step / 3) * 100}%`, backgroundColor: selectedMood ? selectedMood.color : theme.colors.primary }]} />
                    </View>
                </View>
            )}
            
            <View style={[styles.contentWrapper, { backgroundColor: activeBgColor }]}>
                <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
                    
                    {step === 1 && (
                        <View style={styles.centerBox}>
                            <View style={styles.emojiContainer}>
                                <Text style={styles.heroEmoji}>✨</Text>
                            </View>
                            <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Inner Check-in</Text>
                            <Text style={[styles.description, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                                A brief pause to reconnect with your state of being.
                            </Text>
                            <Button fullWidth onPress={() => changeStep(2)} style={styles.mainBtn}>Begin Scan</Button>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.centerBox}>
                            <Text style={[styles.stepTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Energy Level</Text>
                            <Text style={[styles.description, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>How intense is your aura right now?</Text>
                            
                            <View style={styles.energyDisplay}>
                                <Text style={[styles.energyValue, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{Math.round(energy)}</Text>
                                <Text style={[styles.energyPercent, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>%</Text>
                            </View>

                            <Slider
                                style={styles.slider}
                                minimumValue={0}
                                maximumValue={100}
                                value={energy}
                                onValueChange={setEnergy}
                                minimumTrackTintColor={theme.colors.primary}
                                maximumTrackTintColor={isDark ? '#333' : '#e0e0e0'}
                                thumbTintColor={theme.colors.primary}
                            />
                            
                            <View style={styles.sliderLabels}>
                                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>SERENE</Text>
                                <Text style={[styles.label, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>VIBRANT</Text>
                            </View>

                            <Button fullWidth onPress={() => changeStep(3)} style={styles.nextBtn}>Continue</Button>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.fullBox}>
                            <Text style={[styles.stepTitle, { color: isDark ? theme.dark.textMain : theme.light.textMain, textAlign: 'center', marginBottom: 20 }]}>Current Vibe</Text>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moodGrid}>
                                {filteredMoods.map((m) => (
                                    <TouchableOpacity 
                                        key={m.label} 
                                        style={styles.gridItem}
                                        onPress={() => setSelectedMood(m)}
                                        activeOpacity={0.8}
                                    >
                                        <Card isDark={isDark} style={[
                                            styles.moodCard, 
                                            selectedMood?.label === m.label && { borderColor: m.color, borderWidth: 2 }
                                        ]} intensity={selectedMood?.label === m.label ? 60 : 30}>
                                            <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                            <Text style={[styles.moodLabel, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{m.label}</Text>
                                        </Card>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            <Button 
                                disabled={!selectedMood} 
                                fullWidth 
                                onPress={handleFinish} 
                                style={{ marginTop: 20 }}
                            >
                                Log Reflection
                            </Button>
                        </View>
                    )}

                    {step === 4 && (
                        <View style={styles.centerBox}>
                            <View style={[styles.successEmojiContainer, { backgroundColor: selectedMood?.color + '22' }]}>
                                <Text style={styles.heroEmoji}>{selectedMood?.emoji}</Text>
                            </View>
                            <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Recorded.</Text>
                            <Text style={[styles.description, { color: isDark ? theme.dark.textSub : theme.light.textSub, marginBottom: 32 }]}>
                                Your feeling of <Text style={{ fontWeight: '900', color: selectedMood?.color }}>{selectedMood?.label}</Text> has been archived.
                            </Text>
                            
                            <Card isDark={isDark} style={[styles.insightCard, { borderLeftColor: selectedMood?.color, borderLeftWidth: 4 }]}>
                                <Text style={[styles.insightTitle, { color: selectedMood?.color }]}>AURA INSIGHT</Text>
                                <Text style={[styles.insightText, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                                    {energy < 40 ? 
                                        "A lower energy state is perfect for deep introspection or resting your mind." : 
                                        "With this high energy level, your capacity for focus and action is at its peak."}
                                </Text>
                            </Card>

                            {distress ? (
                                <Card isDark={isDark} style={styles.crisisCard}>
                                    <Text style={[styles.crisisTitle, { color: theme.colors.danger }]}>We're glad you checked in</Text>
                                    <Text style={[styles.crisisBody, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>
                                        Heavy moods are signals, not failures. If things feel overwhelming, please reach out to a trained counselor — it takes courage.
                                    </Text>
                                    <Button fullWidth onPress={showCrisisResources} variant="danger" style={{ marginTop: 12 }}>
                                        Emergency & crisis resources
                                    </Button>
                                    <TouchableOpacity onPress={() => navigation.navigate('Breathing')} style={{ marginTop: 16 }}>
                                        <Text style={[styles.calmLink, { color: theme.colors.secondary }]}>Try a 2‑minute breathing reset</Text>
                                    </TouchableOpacity>
                                    <Button 
                                        variant="outline" 
                                        onPress={() => navigation.navigate('Home')} 
                                        style={{ marginTop: 16 }}
                                    >
                                        Skip to Home
                                    </Button>
                                </Card>
                            ) : null}

                            {/* Always show the back button, even for heavy moods */}
                            <View style={styles.buttonContainer}>
                                <Button 
                                    variant="outline" 
                                    fullWidth 
                                    onPress={() => navigation.navigate('Home')}
                                    style={styles.backButton}
                                >
                                    Back to Sanctuary
                                </Button>
                                
                                <TouchableOpacity 
                                    onPress={() => navigation.navigate('Home')} 
                                    style={styles.skipButton}
                                >
                                    <Text style={[styles.skipText, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>
                                        Continue to Home
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </Animated.View>
            </View>
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
    progressContainer: {
        flex: 1,
        height: 4,
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 2,
        marginLeft: theme.spacing.lg,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 2,
    },
    contentWrapper: {
        flex: 1,
        margin: theme.spacing.lg,
        borderRadius: 40,
        padding: 24,
        justifyContent: 'center',
    },
    stepContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    centerBox: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emojiContainer: {
        marginBottom: 24,
    },
    successEmojiContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    fullBox: {
        flex: 1,
    },
    heroEmoji: {
        fontSize: 80,
    },
    title: {
        ...theme.typography.h1,
        textAlign: 'center',
        marginBottom: 12,
    },
    stepTitle: {
        ...theme.typography.h2,
        marginBottom: 8,
    },
    description: {
        ...theme.typography.body,
        textAlign: 'center',
        lineHeight: 24,
    },
    energyDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginVertical: 40,
    },
    energyValue: {
        fontSize: 72,
        fontWeight: '900',
    },
    energyPercent: {
        fontSize: 24,
        fontWeight: '700',
        marginLeft: 4,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
        marginBottom: 40,
    },
    label: {
        ...theme.typography.caption,
        letterSpacing: 1.5,
    },
    moodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingBottom: 20,
    },
    gridItem: {
        width: '48%',
        marginBottom: 16,
    },
    moodCard: {
        alignItems: 'center',
        paddingVertical: 24,
        borderRadius: 24,
    },
    moodEmoji: {
        fontSize: 40,
        marginBottom: 8,
    },
    moodLabel: {
        ...theme.typography.subtitle,
    },
    insightCard: {
        padding: 24,
        borderRadius: 24,
        width: '100%',
    },
    insightTitle: {
        ...theme.typography.caption,
        letterSpacing: 1,
        marginBottom: 8,
    },
    insightText: {
        ...theme.typography.body,
        fontWeight: '600',
        lineHeight: 22,
    },
    mainBtn: {
        marginTop: 24,
    },
    nextBtn: {
        marginTop: 20,
    },
    crisisCard: {
        marginTop: 20,
        padding: theme.spacing.lg,
    },
    crisisTitle: {
        ...theme.typography.subtitle,
        marginBottom: 8,
    },
    crisisBody: {
        ...theme.typography.body,
        lineHeight: 22,
    },
    calmLink: {
        ...theme.typography.subtitle,
        textAlign: 'center',
    },
    buttonContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    backButton: {
        marginBottom: 16,
    },
    skipButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    skipText: {
        ...theme.typography.caption,
        textDecorationLine: 'underline',
    },
});
