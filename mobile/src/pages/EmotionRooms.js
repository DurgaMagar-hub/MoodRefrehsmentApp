import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import io from 'socket.io-client';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import { Feather } from '@expo/vector-icons';
import { SOCKET_URL } from '../config';

const rooms = [
  { id: "sad", name: "Sad Support", icon: "😢", desc: "Share your burden in a safe space.", color: theme.colors.primary },
  { id: "anxiety", name: "Anxiety Relief", icon: "😰", desc: "Calm your mind with the community.", color: theme.colors.secondary },
  { id: "motivation", name: "Motivation Circle", icon: "🔥", desc: "Get inspired and lift others up.", color: theme.colors.accent },
  { id: "lonely", name: "Loneliness", icon: "😔", desc: "Find deep connection and warmth.", color: theme.colors.info || '#0984e3' },
  { id: "stress", name: "Stress Buster", icon: "🤯", desc: "Vent it out and find your peace.", color: theme.colors.danger },
];

const AnimatedRoomCard = ({ room, index, count, isDark, onPress }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                delay: index * 100,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            })
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                <Card isDark={isDark} style={styles.roomCard} intensity={isDark ? 40 : 80}>
                    <View style={styles.roomInner}>
                        <View style={[styles.iconBox, { backgroundColor: room.color + '22' }]}>
                            <Text style={styles.icon}>{room.icon}</Text>
                        </View>
                        
                        <View style={styles.roomInfo}>
                            <View style={styles.nameRow}>
                                <Text style={[styles.roomName, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>{room.name}</Text>
                                {count > 0 && (
                                    <View style={[styles.onlineBadge, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.backgroundSecondary }]}>
                                        <View style={styles.onlinePulse} />
                                        <Text style={styles.onlineText}>{count} ONLINE</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.roomDesc, { color: isDark ? theme.dark.textSub : theme.light.textSub }]}>{room.desc}</Text>
                        </View>

                        <View style={[styles.arrowBox, { backgroundColor: room.color }]}>
                            <Feather name="chevron-right" color="#fff" size={20} />
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default function EmotionRoomsScreen({ navigation }) {
    const { isDarkTheme } = React.useContext(MoodContext);
    const [roomCounts, setRoomCounts] = useState({});
    const isDark = isDarkTheme;

    useEffect(() => {
        const socket = io(SOCKET_URL);
        socket.on("global_room_data", (data) => {
            setRoomCounts(data);
        });
        return () => socket.disconnect();
    }, []);

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDark ? theme.dark.background : theme.light.background }]}>
            <View style={styles.header}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={[styles.backButton, { backgroundColor: isDark ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" color={isDark ? '#fff' : '#000'} size={24} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDark ? theme.dark.textMain : theme.light.textMain }]}>Support Sanctuaries</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
                {rooms.map((room, index) => (
                    <AnimatedRoomCard 
                        key={room.id}
                        room={room}
                        index={index}
                        count={roomCounts[room.id] || 0}
                        isDark={isDark}
                        onPress={() => navigation.navigate('ChatRoom', { id: room.id })}
                    />
                ))}
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
    roomCard: {
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: theme.borderRadius.lg,
    },
    roomInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    icon: {
        fontSize: 32,
    },
    roomInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    roomName: {
        ...theme.typography.h3,
        marginRight: 8, // replaces gap: 8
    },
    roomDesc: {
        ...theme.typography.body,
        fontSize: 13,
        opacity: 0.8,
    },
    onlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(46, 204, 113, 0.4)',
    },
    onlinePulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2ecc71',
        marginRight: 6,
        shadowColor: '#2ecc71',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },
    onlineText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#27ae60',
        letterSpacing: 0.5,
    },
    arrowBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
        ...theme.shadows.soft,
    }
});
