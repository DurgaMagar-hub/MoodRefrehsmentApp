import React, { useContext, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Dimensions, FlatList, Animated } from 'react-native';
import SafeScreen from '../components/SafeScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { MoodContext } from '../context/MoodContext';
import Card from '../components/Card';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock multiple daily quotes for swiping
const dailyQuotes = [
    { id: '1', text: "Happiness is not something ready made. It comes from your own actions.", author: "Dalai Lama", colors: ['#a855f7', '#e879f9'] },
    { id: '2', text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "F.D. Roosevelt", colors: ['#c084fc', '#f0abfc'] },
    { id: '3', text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", colors: ['#d4a574', '#fda4af'] }
];

export default function MotivationScreen({ navigation }) {
    const { quotes, addQuote, isDarkTheme } = useContext(MoodContext);
    const [newQuote, setNewQuote] = useState("");
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleAdd = () => {
        if (newQuote.trim()) {
            addQuote(newQuote.trim());
            setNewQuote("");
        }
    };

    const renderQuoteCard = ({ item }) => {
        return (
            <View style={styles.cardWrapper}>
                <LinearGradient
                    colors={item.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.featuredCard}
                >
                    <View style={styles.badge}>
                        <Feather name="zap" size={14} color="#fff" />
                        <Text style={styles.badgeText}>DAILY DROP</Text>
                    </View>
                    
                    <Text style={styles.quoteText}>"{item.text}"</Text>
                    
                    <View style={styles.authorRow}>
                        <View style={styles.authorLine} />
                        <Text style={styles.authorText}>{item.author}</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    return (
        <SafeScreen style={[styles.container, { backgroundColor: isDarkTheme ? theme.dark.background : theme.light.background }]}>
            <View style={styles.topBar}>
                <TouchableOpacity 
                    onPress={() => navigation.goBack()} 
                    style={[styles.backBtn, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card }]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Feather name="chevron-left" size={24} color={isDarkTheme ? '#fff' : '#000'} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Inspiration</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                {/* Swiping Indicator Text */}
                <View style={styles.swipeHintRow}>
                    <Text style={[styles.swipeHint, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>Swipe to transform your mindset</Text>
                    <Feather name="arrow-right" size={12} color={isDarkTheme ? theme.dark.textSub : theme.light.textSub} style={{opacity: 0.5}} />
                </View>

                {/* Featured Swiping Cards */}
                <View style={styles.carouselContainer}>
                    <Animated.FlatList 
                        data={dailyQuotes}
                        keyExtractor={item => item.id}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        bounces={false}
                        renderItem={renderQuoteCard}
                        onScroll={Animated.event(
                            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                            { useNativeDriver: true }
                        )}
                    />
                </View>

                {/* Add Quote Section */}
                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Save a Thought</Text>
                </View>
                
                <View style={[styles.inputBox, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.card, borderColor: isDarkTheme ? theme.dark.border : theme.light.border }]}>
                    <TextInput 
                        style={[styles.input, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}
                        placeholder="Type a quote that moves you..."
                        placeholderTextColor={isDarkTheme ? theme.dark.textSub : theme.light.textSub}
                        value={newQuote}
                        onChangeText={setNewQuote}
                        multiline
                    />
                    <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: newQuote.trim() ? theme.colors.primary : (isDarkTheme ? theme.dark.border : theme.light.backgroundSecondary) }]} 
                        onPress={handleAdd}
                        disabled={!newQuote.trim()}
                        activeOpacity={0.8}
                    >
                        <Feather name="plus" color={newQuote.trim() ? "#fff" : (isDarkTheme ? '#555' : '#aaa')} size={20} />
                    </TouchableOpacity>
                </View>

                {/* Vault Section */}
                <View style={styles.sectionHeader}>
                    <View style={styles.vaultHeader}>
                        <Text style={[styles.sectionTitle, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>Your Vault</Text>
                        <View style={[styles.countBadge, { backgroundColor: isDarkTheme ? theme.colors.glassDark : theme.light.backgroundSecondary }]}>
                            <Text style={[styles.countText, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>{quotes.length} saved</Text>
                        </View>
                    </View>
                </View>

                {quotes.length === 0 ? (
                    <View style={styles.emptyVault}>
                        <Feather name="bookmark" size={48} color={isDarkTheme ? theme.dark.border : theme.light.border} />
                        <Text style={[styles.emptyText, { color: isDarkTheme ? theme.dark.textSub : theme.light.textSub }]}>Your vault is empty. Save a quote above.</Text>
                    </View>
                ) : (
                    <View style={styles.vaultList}>
                        {quotes.map((q, i) => (
                            <Card key={i} isDark={isDarkTheme} style={styles.quoteListItem}>
                                <Feather name="message-square" size={20} color={theme.colors.primary} style={styles.quoteIcon} />
                                <Text style={[styles.vaultQuoteText, { color: isDarkTheme ? theme.dark.textMain : theme.light.textMain }]}>{q}</Text>
                            </Card>
                        ))}
                    </View>
                )}

            </ScrollView>
        </SafeScreen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    topBar: {
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
    title: {
        ...theme.typography.h2,
        marginLeft: theme.spacing.md,
    },
    scroll: {
        paddingTop: theme.spacing.md,
        paddingBottom: 60,
    },
    swipeHintRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    swipeHint: {
        ...theme.typography.caption,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginRight: 6,
    },
    carouselContainer: {
        height: 280,
        marginBottom: theme.spacing.xl,
    },
    cardWrapper: {
        width: width,
        paddingHorizontal: theme.spacing.lg,
    },
    featuredCard: {
        flex: 1,
        padding: 32,
        borderRadius: 32,
        justifyContent: 'center',
        ...theme.shadows.glow(theme.colors.primary), // Use dynamic glow or primary
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 20,
    },
    badgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '900',
        marginLeft: 6,
        letterSpacing: 1,
    },
    quoteText: {
        color: '#fff',
        fontSize: 26,
        fontWeight: '700',
        lineHeight: 36,
        marginBottom: 24,
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    authorLine: {
        width: 30,
        height: 2,
        backgroundColor: '#fff',
        opacity: 0.6,
        marginRight: 12,
    },
    authorText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    sectionHeader: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    sectionTitle: {
        ...theme.typography.h3,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: theme.spacing.lg,
        padding: 12,
        paddingLeft: 20,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: theme.spacing.xl,
    },
    input: {
        flex: 1,
        fontSize: 16,
        maxHeight: 100,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    saveBtn: {
        width: 48,
        height: 48,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    vaultHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        ...theme.typography.caption,
    },
    emptyVault: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.5,
    },
    emptyText: {
        marginTop: 12,
        textAlign: 'center',
        fontSize: 15,
        fontStyle: 'italic',
        paddingHorizontal: 40,
    },
    vaultList: {
        paddingHorizontal: theme.spacing.lg,
        // Removed gap: 16 to prevent Android Yoga instability
    },
    quoteListItem: {
        padding: 24,
        borderRadius: 24,
        flexDirection: 'row',
        marginBottom: 16, // Replaced gap with marginBottom
    },
    quoteIcon: {
        opacity: 0.4,
        marginRight: 16,
        marginTop: 2,
    },
    vaultQuoteText: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        fontStyle: 'italic',
        fontWeight: '500',
    }
});
