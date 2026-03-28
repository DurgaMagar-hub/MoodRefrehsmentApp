import React, { useState, useEffect, useRef, useContext } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    FlatList, 
    KeyboardAvoidingView, 
    Platform, 
    TouchableOpacity, 
    ActivityIndicator,
    Dimensions
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import io from 'socket.io-client';
import axios from 'axios';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { Feather } from '@expo/vector-icons';
import { SOCKET_URL, API_URL } from '../config';

const { width } = Dimensions.get('window');

export default function ChatRoomScreen({ route, navigation }) {
    const { id: roomId } = route.params;
    const { user, isDarkTheme } = useContext(MoodContext);
    
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [roomUsers, setRoomUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    
    const socket = useRef(null);
    const flatListRef = useRef(null);

    const roomDetails = {
        sad: { name: "Sad Support", color: theme.colors.primary, icon: "😢" },
        anxiety: { name: "Anxiety Relief", color: theme.colors.secondary, icon: "😰" },
        motivation: { name: "Motivation Circle", color: theme.colors.accent, icon: "🔥" },
        lonely: { name: "Loneliness", color: theme.colors.info || '#0984e3', icon: "😔" },
        stress: { name: "Stress Buster", color: theme.colors.danger, icon: "🤯" },
    }[roomId] || { name: "Support Room", color: theme.colors.primary, icon: "💬" };

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await axios.get(`${API_URL}/chats/${roomId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("History error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();

        socket.current = io(SOCKET_URL);
        socket.current.emit("join_room", roomId);

        socket.current.on("receive_message", (data) => {
            setMessages((prev) => [...prev, data]);
        });

        socket.current.on("room_data", (data) => {
            setRoomUsers(data.users);
        });

        return () => {
            socket.current.disconnect();
        };
    }, [roomId]);

    const sendMessage = () => {
        if (currentMessage.trim() !== "") {
            const messageData = {
                room: roomId,
                sender: user?.name || "Guest",
                text: currentMessage,
                color: user?.color || roomDetails.color,
                createdAt: new Date().toISOString(),
            };

            socket.current.emit("send_message", messageData);
            setMessages((prev) => [...prev, messageData]);
            setCurrentMessage("");
        }
    };

    const renderMessage = ({ item, index }) => {
        const isMe = item.senderName === user?.name || item.sender === user?.name;
        const prevMessage = messages[index - 1];
        const showAvatar = !isMe && (!prevMessage || (prevMessage.senderName || prevMessage.sender) !== (item.senderName || item.sender));
        
        return (
            <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
                {!isMe && (
                    <View style={styles.avatarSpace}>
                        {showAvatar ? (
                            <View style={[styles.avatar, { backgroundColor: item.color || roomDetails.color + '44' }]}>
                                <Text style={styles.avatarText}>{(item.senderName || item.sender)?.[0]}</Text>
                            </View>
                        ) : null}
                    </View>
                )}
                <View style={[
                    styles.messageBubble, 
                    isMe ? [styles.myBubble, { backgroundColor: roomDetails.color }] : [styles.otherBubble, { backgroundColor: isDarkTheme ? theme.colors.glassDark : '#f0f0f0' }]
                ]}>
                    {!isMe && showAvatar && (
                        <Text style={[styles.senderName, { color: roomDetails.color }]}>
                            {item.senderName || item.sender}
                        </Text>
                    )}
                    <Text style={[styles.messageText, { color: isMe ? '#fff' : (isDarkTheme ? theme.dark.textMain : theme.light.textMain) }]}>
                        {item.text}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background }]}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
                style={styles.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                    <TouchableOpacity 
                        onPress={() => navigation.goBack()} 
                        style={[styles.backBtn, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="chevron-left" color={isDarkTheme ? '#fff' : '#000'} size={24} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.roomTitle, { color: isDarkTheme ? '#fff' : '#000' }]}>{roomDetails.name} {roomDetails.icon}</Text>
                        <View style={styles.statusRow}>
                            <View style={styles.pulseDot} />
                            <Text style={styles.onlineStatus}>{roomUsers} soul(s) present</Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={roomDetails.color} />
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Input Area */}
                <View style={[styles.inputContainer, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background }]}>
                    <View style={[styles.inputWrapper, { backgroundColor: isDarkTheme ? theme.colors.glassDark : '#f5f5f5' }]}>
                        <TextInput 
                            style={[styles.input, { color: isDarkTheme ? '#fff' : '#000' }]}
                            placeholder="Type a message..."
                            placeholderTextColor={isDarkTheme ? '#666' : '#aaa'}
                            value={currentMessage}
                            onChangeText={setCurrentMessage}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, { backgroundColor: currentMessage.trim() ? roomDetails.color : 'transparent' }]} 
                            onPress={sendMessage}
                            disabled={!currentMessage.trim()}
                        >
                            <Feather name="send" color={currentMessage.trim() ? "#fff" : (isDarkTheme ? '#444' : '#ccc')} size={20} />
                        </TouchableOpacity>
                    </View>
                </View>
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
    headerInfo: {
        marginLeft: theme.spacing.md,
    },
    roomTitle: {
        ...theme.typography.h3,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#2ecc71',
        marginRight: 6,
    },
    onlineStatus: {
        fontSize: 12,
        color: '#2ecc71',
        fontWeight: '700',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: theme.spacing.lg,
        paddingBottom: 20,
    },
    messageWrapper: {
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    otherMessageWrapper: {
        justifyContent: 'flex-start',
    },
    avatarSpace: {
        width: 40,
        marginRight: 8,
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    avatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
    },
    messageBubble: {
        maxWidth: width * 0.7,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        borderBottomRightRadius: 4,
        ...theme.shadows.soft,
    },
    otherBubble: {
        borderBottomLeftRadius: 4,
    },
    senderName: {
        fontSize: 10,
        fontWeight: '900',
        marginBottom: 4,
        textTransform: 'uppercase',
        opacity: 0.8,
    },
    messageText: {
        ...theme.typography.body,
        fontSize: 15,
        lineHeight: 20,
    },
    inputContainer: {
        padding: theme.spacing.md,
        paddingBottom: Platform.OS === 'ios' ? 0 : theme.spacing.md,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 28,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 120,
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 8,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    }
});
