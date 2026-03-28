import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ScrollView, 
    TouchableOpacity, 
    Animated, 
    Easing, 
    Dimensions, 
    BackHandler
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import SafeScreen from '../components/SafeScreen';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.75;
const RADIUS = (CIRCLE_SIZE / 2) - 15;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const TECHNIQUES = [
    {
        id: "box",
        name: "Box Breathing",
        description: "Navy SEAL focus. Equal parts for mental resilience.",
        pattern: [4000, 4000, 4000, 4000],
        labels: ["Inhale", "Hold", "Exhale", "Hold"],
        iconName: "maximize",
        color: "#a855f7"
    },
    {
        id: "478",
        name: "4-7-8 Relax",
        description: "Anxiety relief. A natural reset for the spirit.",
        pattern: [4000, 7000, 8000, 0],
        labels: ["Inhale", "Hold", "Exhale", ""],
        iconName: "moon",
        color: "#e879f9"
    },
    {
        id: "vagus",
        name: "Vagus Release",
        description: "Deep relaxation. Twice as much out than in.",
        pattern: [4000, 0, 8000, 0],
        labels: ["Inhale", "", "Exhale", ""],
        iconName: "droplet",
        color: "#d4a574"
    },
    {
        id: "soma",
        name: "Soma Rhythm",
        description: "Energizing breath. Ignite your focus rapidly.",
        pattern: [2000, 0, 2000, 0],
        labels: ["Inhale", "", "Exhale", ""],
        iconName: "zap",
        color: "#fda4af"
    }
];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function BreathingScreen({ navigation }) {
    const { isDarkTheme, aura } = React.useContext(MoodContext);
    const [selectedTech, setSelectedTech] = useState(null);
    const [isActive, setIsActive] = useState(false);
    const [stageIndex, setStageIndex] = useState(0);
    
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const haloAnim = useRef(new Animated.Value(1.1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!isActive || !selectedTech) {
            scaleAnim.setValue(1);
            haloAnim.setValue(1);
            progressAnim.setValue(0);
            return;
        }

        const runCycle = (index) => {
            const duration = selectedTech.pattern[index];
            if (duration === 0) {
                runCycle((index + 1) % 4);
                return;
            }

            setStageIndex(index);
            
            // Set Target Scale
            let targetScale = 1;
            if (index === 0 || index === 1) targetScale = 1.3; // Inhale / Hold
            else targetScale = 0.8; // Exhale / Hold

            // Animate Scale and Progress
            progressAnim.setValue(0);
            
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: targetScale,
                    duration: duration,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(haloAnim, {
                    toValue: targetScale * 1.2,
                    duration: duration,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ]).start(({ finished }) => {
                if (finished) {
                    runCycle((index + 1) % 4);
                }
            });
        };

        runCycle(0);

        return () => {
            scaleAnim.stopAnimation();
            haloAnim.stopAnimation();
            progressAnim.stopAnimation();
        };
    }, [isActive, selectedTech]);

    useEffect(() => {
        const backAction = () => {
            if (isActive) {
                handleStop();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [isActive]);

    const handleStart = (tech) => {
        setSelectedTech(tech);
        setIsActive(true);
    };

    const handleStop = () => {
        setIsActive(false);
        setSelectedTech(null);
    };

    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [CIRCUMFERENCE, 0],
    });

    if (!selectedTech) {
        return (
            <SafeScreen style={[styles.container, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.backButton, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="chevron-left" color={isDarkTheme ? '#fff' : '#000'} size={24} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Sanctuary</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.sub, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>Restore your inner balance with guided intervals.</Text>
                    
                    {TECHNIQUES.map((tech) => (
                        <TouchableOpacity key={tech.id} onPress={() => handleStart(tech)} activeOpacity={0.8}>
                            <Card isDark={isDarkTheme} style={styles.techCard} intensity={isDarkTheme ? 40 : 80}>
                                <View style={[styles.iconBox, { backgroundColor: tech.color + '22' }]}>
                                    <Feather name={tech.iconName} size={24} color={tech.color} />
                                </View>
                                <View style={styles.techInfo}>
                                    <View style={styles.nameRow}>
                                        <Text style={[styles.techName, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>{tech.name}</Text>
                                        <View style={[styles.typeBadge, { backgroundColor: tech.color + '22' }]}>
                                            <Text style={[styles.typeText, { color: tech.color }]}>{tech.id.toUpperCase()}</Text>
                                        </View>
                                    </View>
                                    <Text style={[styles.techDesc, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>{tech.description}</Text>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))}
                    
                    <View style={styles.footerInfo}>
                        <Feather name="wind" color={isDarkTheme ? theme.dark.border : theme.light.border} size={40} />
                        <Text style={[styles.footerText, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>Deep breaths reduce cortisol and reset the nervous system.</Text>
                    </View>
                </ScrollView>
            </SafeScreen>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background, justifyContent: 'center', alignItems: 'center' }]}>
            <View style={styles.animatedWrapper}>
                {/* Halo Glow */}
                <Animated.View style={[
                    styles.halo, 
                    { 
                        backgroundColor: selectedTech.color,
                        transform: [{ scale: haloAnim }],
                        opacity: 0.15
                    }
                ]} />
                
                {/* Progress Ring */}
                <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
                    <Circle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={isDarkTheme ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"}
                        strokeWidth="4"
                        fill="none"
                    />
                    <AnimatedCircle
                        cx={CIRCLE_SIZE / 2}
                        cy={CIRCLE_SIZE / 2}
                        r={RADIUS}
                        stroke={selectedTech.color}
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                    />
                </Svg>

                <Animated.View style={[
                    styles.core,
                    { 
                        backgroundColor: isDarkTheme ? theme.colors.glassDark : '#fff',
                        transform: [{ scale: scaleAnim }],
                        borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                ]}>
                    <Text style={[styles.stageSub, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>{selectedTech.name}</Text>
                    <Text style={[styles.stageLabel, { color: selectedTech.color }]}>
                        {selectedTech.labels[stageIndex] || "READY"}
                    </Text>
                </Animated.View>
            </View>

            <TouchableOpacity 
                onPress={handleStop} 
                style={styles.activeBackBtn}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
                <Feather name="x" size={24} color={isDarkTheme ? '#fff' : '#000'} />
            </TouchableOpacity>

            <View style={styles.instructionBox}>
                <Text style={[styles.activeName, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>{selectedTech.description}</Text>
            </View>

            <View style={styles.buttonRow}>
                <View style={styles.buttonSpacing}>
                    <Button variant="outline" onPress={handleStop}>Change Path</Button>
                </View>
                <View style={styles.buttonSpacing}>
                    <Button variant="danger" onPress={() => navigation.navigate('Home')}>End Session</Button>
                </View>
            </View>
        </View>
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
        paddingTop: theme.spacing.md,
    },
    sub: {
        ...theme.typography.body,
        marginBottom: theme.spacing.xl,
        opacity: 0.8,
    },
    techCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
    },
    iconBox: {
        width: 60,
        height: 60,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    techInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    techName: {
        ...theme.typography.h3,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1,
    },
    techDesc: {
        ...theme.typography.body,
        fontSize: 13,
        opacity: 0.8,
    },
    footerInfo: {
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 60,
        opacity: 0.8,
    },
    footerText: {
        textAlign: 'center',
        paddingHorizontal: 40,
        marginTop: 16,
        ...theme.typography.caption,
        lineHeight: 18,
    },
    animatedWrapper: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    halo: {
        position: 'absolute',
        width: CIRCLE_SIZE * 0.8,
        height: CIRCLE_SIZE * 0.8,
        borderRadius: CIRCLE_SIZE * 0.4,
    },
    svg: {
        position: 'absolute',
        transform: [{ rotate: '-90deg' }],
    },
    core: {
        width: CIRCLE_SIZE * 0.55,
        height: CIRCLE_SIZE * 0.55,
        borderRadius: CIRCLE_SIZE * 0.3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    stageSub: {
        ...theme.typography.caption,
        letterSpacing: 2,
        marginBottom: 6,
    },
    stageLabel: {
        fontSize: 32,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    instructionBox: {
        paddingHorizontal: 50,
        marginBottom: 60,
    },
    activeName: {
        ...theme.typography.h3,
        textAlign: 'center',
        lineHeight: 26,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    buttonSpacing: {
        marginHorizontal: 8,
    },
    activeBackBtn: {
        position: 'absolute',
        top: 60,
        left: 30,
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(120,120,120,0.1)',
    }
});
