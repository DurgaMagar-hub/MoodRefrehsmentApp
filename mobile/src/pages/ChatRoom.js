import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    FlatList, 
    KeyboardAvoidingView, 
    Platform, 
    TouchableOpacity, 
    Pressable,
    ActivityIndicator,
    Dimensions,
    Alert,
    Modal,
} from 'react-native';
import SafeScreen from '../components/SafeScreen';
import io from 'socket.io-client';
import axios from 'axios';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import { Feather } from '@expo/vector-icons';
import { SOCKET_URL, API_URL } from '../config';
import { getOrCreateReportClientKey } from '../utils/reportClientId';
import { formatDeviceTime } from '../utils/deviceTime';

const { width } = Dimensions.get('window');

/** Group consecutive bubbles only when same logical sender (id if present, else display name). */
function senderGroupKey(m) {
    const n = m?.senderName || m?.sender || 'Guest';
    if (m?.senderUserId != null && m.senderUserId !== '') return `u:${m.senderUserId}`;
    return `g:${n}`;
}

export default function ChatRoomScreen({ route, navigation }) {
    const { id: roomId } = route.params;
    const { user, isDarkTheme } = useContext(MoodContext);
    
    const [messages, setMessages] = useState([]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [roomUsers, setRoomUsers] = useState(0);
    const [loading, setLoading] = useState(true);
    const [reportTarget, setReportTarget] = useState(null);
    const [reportReason, setReportReason] = useState('');
    const [inputFocused, setInputFocused] = useState(false);
    
    const socket = useRef(null);
    const flatListRef = useRef(null);

    const roomDetails = useMemo(
        () =>
            ({
                sad: { name: 'Sad Support', color: theme.colors.primary, icon: '😢' },
                anxiety: { name: 'Anxiety Relief', color: theme.colors.secondary, icon: '😰' },
                motivation: { name: 'Motivation Circle', color: theme.colors.accent, icon: '🔥' },
                lonely: { name: 'Loneliness', color: theme.colors.info || '#0984e3', icon: '😔' },
                stress: { name: 'Stress Buster', color: theme.colors.danger, icon: '🤯' },
            }[roomId] || { name: 'Support Room', color: theme.colors.primary, icon: '💬' }),
        [roomId]
    );

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
            setMessages((prev) => {
                if (data?.id != null && prev.some((m) => m.id === data.id)) return prev;
                return [...prev, data];
            });
        });

        socket.current.on("room_data", (data) => {
            setRoomUsers(data.users);
        });

        return () => {
            socket.current.disconnect();
        };
    }, [roomId]);

    const sendMessage = () => {
        const text = currentMessage.trim();
        if (!text || !socket.current) return;
        const messageData = {
            room: roomId,
            senderName: user?.name || 'Guest',
            text,
            color: user?.color || roomDetails.color,
            senderUserId: user?.id != null ? user.id : null,
        };
        socket.current.emit('send_message', messageData);
        setCurrentMessage('');
    };

    const displayName = (m) => m?.senderName || m?.sender || 'Guest';

    const submitReport = async () => {
        if (!reportTarget?.id) return;
        try {
            const body = { messageId: reportTarget.id, reason: reportReason.trim() };
            if (user?.id != null) {
                body.reporterUserId = user.id;
            } else {
                body.reporterClientKey = await getOrCreateReportClientKey();
            }
            await axios.post(`${API_URL}/chat-reports`, body);
            setReportTarget(null);
            setReportReason('');
            Alert.alert(
                'Report sent',
                user?.id
                    ? 'Admins see the sender’s account id (if they were signed in) and this exact message.'
                    : 'Admins see this message. If the sender was signed in, their account id is stored too.'
            );
        } catch (e) {
            Alert.alert('Could not report', e.response?.data?.error || 'Try again.');
        }
    };

    const renderMessage = ({ item, index }) => {
        const myId = user?.id != null ? Number(user.id) : null;
        const sid = item.senderUserId != null ? Number(item.senderUserId) : null;
        const isMe =
            (myId != null && sid != null && myId === sid) ||
            (myId != null && sid == null && displayName(item) === user?.name) ||
            (myId == null && sid == null && displayName(item) === (user?.name || 'Guest'));

        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        const sameSenderAsPrev = prevMessage && senderGroupKey(prevMessage) === senderGroupKey(item);
        const sameSenderAsNext = nextMessage && senderGroupKey(nextMessage) === senderGroupKey(item);
        const showAvatar = !isMe && !sameSenderAsPrev;
        const isAdmin = user?.role === 'admin';
        const canLongPressReport = !isMe && item.id != null;
        const timeStr = formatDeviceTime(item.createdAt);

        const BubbleBody = (
            <>
                {!isMe && showAvatar && (
                    <Text style={[styles.senderName, { color: roomDetails.color }]}>{displayName(item)}</Text>
                )}
                {isAdmin ? (
                    <View style={[styles.adminPill, { borderColor: isMe ? 'rgba(255,255,255,0.35)' : roomDetails.color + '55' }]}>
                        <Text
                            style={[styles.adminMeta, { color: isMe ? 'rgba(255,255,255,0.92)' : roomDetails.color }]}
                            numberOfLines={1}
                        >
                            UID {item.senderUserId ?? '—'} · #{item.id ?? '—'}
                        </Text>
                    </View>
                ) : null}
                <Text style={[styles.messageText, { color: isMe ? '#fff' : isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                    {item.text}
                </Text>
                {timeStr ? (
                    <Text
                        style={[
                            styles.timeMeta,
                            { color: isMe ? 'rgba(255,255,255,0.72)' : isDarkTheme ? theme.dark.textSub : theme.light.textSub },
                        ]}
                    >
                        {timeStr}
                    </Text>
                ) : null}
            </>
        );

        const wrapperMargin = sameSenderAsPrev ? 2 : isMe ? 10 : 12;

        return (
            <View
                style={[
                    styles.messageWrapper,
                    isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
                    { marginBottom: wrapperMargin },
                ]}
            >
                {!isMe && (
                    <View style={styles.avatarSpace}>
                        {showAvatar ? (
                            <View
                                style={[
                                    styles.avatar,
                                    {
                                        backgroundColor: item.color || roomDetails.color + '66',
                                        borderColor: roomDetails.color + '99',
                                    },
                                ]}
                            >
                                <Text style={styles.avatarText}>{(item.senderName || item.sender || 'G')?.[0]?.toUpperCase?.() || '?'}</Text>
                            </View>
                        ) : (
                            <View style={styles.avatarSpacer} />
                        )}
                    </View>
                )}
                {canLongPressReport ? (
                    <Pressable
                        onLongPress={() => setReportTarget(item)}
                        delayLongPress={450}
                        android_ripple={{ color: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}
                        style={({ pressed }) => [
                            styles.messageBubble,
                            isMe
                                ? [
                                      styles.myBubble,
                                      {
                                          backgroundColor: roomDetails.color,
                                          borderTopRightRadius: sameSenderAsNext ? 16 : 6,
                                          borderBottomRightRadius: sameSenderAsPrev ? 16 : 20,
                                      },
                                  ]
                                : [
                                      styles.otherBubble,
                                      {
                                          backgroundColor: isDarkTheme ? 'rgba(22, 32, 48, 0.92)' : '#ffffff',
                                          borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : roomDetails.color + '22',
                                          borderTopLeftRadius: sameSenderAsNext ? 16 : 6,
                                          borderBottomLeftRadius: sameSenderAsPrev ? 16 : 20,
                                      },
                                  ],
                            pressed && !isMe && styles.bubblePressed,
                        ]}
                    >
                        {BubbleBody}
                    </Pressable>
                ) : (
                    <View
                        style={[
                            styles.messageBubble,
                            isMe
                                ? [
                                      styles.myBubble,
                                      {
                                          backgroundColor: roomDetails.color,
                                          borderTopRightRadius: sameSenderAsNext ? 16 : 6,
                                          borderBottomRightRadius: sameSenderAsPrev ? 16 : 20,
                                      },
                                  ]
                                : [
                                      styles.otherBubble,
                                      {
                                          backgroundColor: isDarkTheme ? 'rgba(22, 32, 48, 0.92)' : '#ffffff',
                                          borderColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : roomDetails.color + '22',
                                          borderTopLeftRadius: sameSenderAsNext ? 16 : 6,
                                          borderBottomLeftRadius: sameSenderAsPrev ? 16 : 20,
                                      },
                                  ],
                        ]}
                    >
                        {BubbleBody}
                    </View>
                )}
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
                <View
                    style={[
                        styles.header,
                        {
                            borderBottomColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            backgroundColor: isDarkTheme ? 'rgba(8, 14, 24, 0.92)' : 'rgba(255,255,255,0.72)',
                        },
                    ]}
                >
                    <View style={[styles.headerAccent, { backgroundColor: roomDetails.color }]} />
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={[styles.backBtn, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.cardSolid }]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Feather name="chevron-left" color={isDarkTheme ? '#fff' : theme.light.textMain} size={22} />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <View style={styles.headerTitleRow}>
                            <View style={[styles.roomEmojiCircle, { backgroundColor: roomDetails.color + '28' }]}>
                                <Text style={styles.roomEmoji}>{roomDetails.icon}</Text>
                            </View>
                            <View style={styles.headerTitleTextCol}>
                                <Text
                                    style={[styles.roomTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                                    numberOfLines={1}
                                >
                                    {roomDetails.name}
                                </Text>
                                <View style={styles.statusRow}>
                                    <View style={[styles.pulseDot, { backgroundColor: theme.colors.secondary }]} />
                                    <Text style={[styles.onlineStatus, { color: theme.colors.secondary }]}>
                                        {roomUsers} {roomUsers === 1 ? 'person' : 'people'} here
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.holdHintPill, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.06)' : roomDetails.color + '14' }]}>
                            <Feather name="flag" size={12} color={roomDetails.color} style={styles.holdHintIcon} />
                            <Text style={[styles.holdHint, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                                Long-press a message to report
                            </Text>
                        </View>
                    </View>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={roomDetails.color} />
                    </View>
                ) : messages.length === 0 ? (
                    <View style={styles.emptyChat}>
                        <Text style={styles.emptyEmoji}>{roomDetails.icon}</Text>
                        <Text style={[styles.emptyTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                            You’re early
                        </Text>
                        <Text style={[styles.emptySub, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                            Say hello — this space is for gentle, supportive chat.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) =>
                            item.id != null ? `m-${item.id}` : `i-${index}`
                        }
                        renderItem={renderMessage}
                        contentContainerStyle={styles.listContent}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                {/* Input Area */}
                <View
                    style={[
                        styles.inputContainer,
                        {
                            backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background,
                            borderTopColor: isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.inputWrapper,
                            {
                                backgroundColor: isDarkTheme ? 'rgba(18, 28, 42, 0.95)' : '#ffffff',
                                borderColor: inputFocused ? roomDetails.color + '88' : isDarkTheme ? 'rgba(255,255,255,0.1)' : roomDetails.color + '22',
                            },
                        ]}
                    >
                        <TextInput
                            style={[styles.input, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                            placeholder="Message…"
                            placeholderTextColor={isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                            value={currentMessage}
                            onChangeText={setCurrentMessage}
                            onFocus={() => setInputFocused(true)}
                            onBlur={() => setInputFocused(false)}
                            multiline
                        />
                        <TouchableOpacity
                            style={[
                                styles.sendBtn,
                                {
                                    backgroundColor: currentMessage.trim() ? roomDetails.color : isDarkTheme ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                    opacity: currentMessage.trim() ? 1 : 0.55,
                                },
                            ]}
                            onPress={sendMessage}
                            disabled={!currentMessage.trim()}
                            activeOpacity={0.85}
                        >
                            <Feather
                                name="send"
                                color={currentMessage.trim() ? '#fff' : isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                                size={18}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <Modal visible={!!reportTarget} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View
                        style={[
                            styles.modalBox,
                            {
                                backgroundColor: isDarkTheme ? 'rgba(18, 28, 42, 0.98)' : '#fff',
                                borderColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : theme.light.border,
                            },
                        ]}
                    >
                        <View style={[styles.modalIconWrap, { backgroundColor: theme.colors.danger + '18' }]}>
                            <Feather name="flag" size={22} color={theme.colors.danger} />
                        </View>
                        <Text style={[styles.modalTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>
                            Report message?
                        </Text>
                        <Text style={[styles.modalSnippet, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]} numberOfLines={4}>
                            {reportTarget?.text}
                        </Text>
                        <Text style={[styles.modalMeta, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>
                            Message #{reportTarget?.id}
                            {reportTarget?.senderUserId != null
                                ? ` · sender account id ${reportTarget.senderUserId}`
                                : ' · sender was not signed in (no account id)'}
                        </Text>
                        <TextInput
                            style={[
                                styles.reasonInput,
                                {
                                    color: isDarkTheme ? '#fff' : '#000',
                                    borderColor: isDarkTheme ? 'rgba(255,255,255,0.2)' : '#ddd',
                                    backgroundColor: isDarkTheme ? 'rgba(0,0,0,0.2)' : '#f8f8f8',
                                },
                            ]}
                            placeholder="Optional note for admins"
                            placeholderTextColor={isDarkTheme ? '#888' : '#999'}
                            value={reportReason}
                            onChangeText={setReportReason}
                            multiline
                        />
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: isDarkTheme ? 'rgba(255,255,255,0.1)' : '#eee' }]}
                                onPress={() => {
                                    setReportTarget(null);
                                    setReportReason('');
                                }}
                            >
                                <Text style={{ color: isDarkTheme ? '#fff' : '#333', fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: theme.colors.danger }]}
                                onPress={submitReport}
                            >
                                <Text style={{ color: '#fff', fontWeight: '700' }}>Submit</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
        alignItems: 'flex-start',
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
    },
    headerAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
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
        marginLeft: theme.spacing.sm,
        flex: 1,
        minWidth: 0,
    },
    headerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roomEmojiCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    roomEmoji: {
        fontSize: 22,
    },
    headerTitleTextCol: {
        flex: 1,
        minWidth: 0,
    },
    roomTitle: {
        fontSize: 19,
        fontFamily: theme.fontFamily.displaySemi,
        letterSpacing: -0.3,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    pulseDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        marginRight: 6,
    },
    onlineStatus: {
        fontSize: 12,
        fontFamily: theme.fontFamily.bodyMedium,
        fontWeight: '600',
    },
    holdHintPill: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginTop: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: theme.borderRadius.full,
    },
    holdHintIcon: {
        marginRight: 6,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.md,
        paddingBottom: 24,
    },
    emptyChat: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyEmoji: {
        fontSize: 48,
        marginBottom: 12,
        opacity: 0.9,
    },
    emptyTitle: {
        fontSize: 20,
        fontFamily: theme.fontFamily.displaySemi,
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        fontFamily: theme.fontFamily.body,
    },
    messageWrapper: {
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
        marginRight: 6,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    avatarSpacer: {
        width: 36,
        height: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
        borderWidth: 2,
    },
    avatarText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '900',
    },
    messageBubble: {
        maxWidth: width * 0.76,
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 20,
    },
    myBubble: {
        ...theme.shadows.soft,
    },
    otherBubble: {
        borderWidth: 1,
        ...theme.shadows.soft,
    },
    senderName: {
        fontSize: 11,
        fontFamily: theme.fontFamily.bodySemi,
        marginBottom: 6,
        textTransform: 'none',
        letterSpacing: 0.2,
        opacity: 0.95,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
        fontFamily: theme.fontFamily.body,
    },
    timeMeta: {
        fontSize: 11,
        marginTop: 6,
        alignSelf: 'flex-end',
        fontFamily: theme.fontFamily.bodyLight,
    },
    adminPill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 6,
        maxWidth: width * 0.65,
    },
    adminMeta: {
        fontSize: 9,
        fontFamily: theme.fontFamily.bodyMedium,
        opacity: 1,
    },
    bubblePressed: {
        opacity: 0.92,
    },
    holdHint: {
        fontSize: 11,
        fontFamily: theme.fontFamily.bodyMedium,
        flexShrink: 1,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalBox: {
        borderRadius: theme.borderRadius.lg,
        padding: 22,
        borderWidth: 1,
        ...theme.shadows.medium,
    },
    modalIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        alignSelf: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: theme.fontFamily.displaySemi,
        marginBottom: 10,
    },
    modalSnippet: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    modalMeta: {
        fontSize: 12,
        marginBottom: 12,
    },
    reasonInput: {
        minHeight: 72,
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        textAlignVertical: 'top',
        marginBottom: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modalBtn: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginLeft: 10,
    },
    inputContainer: {
        paddingHorizontal: theme.spacing.md,
        paddingTop: theme.spacing.sm,
        paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: theme.borderRadius.xl,
        paddingHorizontal: 4,
        paddingVertical: 4,
        paddingLeft: 14,
        borderWidth: 1.5,
        ...theme.shadows.soft,
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
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 4,
    },
});
