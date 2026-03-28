import React, { createContext, useState, useEffect, useMemo } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import axios from "axios";
import { theme } from "../styles/theme";
import { API_URL } from "../config";
import { computeStreak, computeWeeklySummary, generateInsightMessages, computeBadges } from "../utils/moodAnalytics";

export const MoodContext = createContext();

export const MoodProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [moodHistory, setMoodHistory] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [isDarkTheme, setIsDarkTheme] = useState(Appearance.getColorScheme() === 'dark');
    
    const [settings, setSettings] = useState({ theme: 'system', notifications: true });

    // Initial Data Fetch
    useEffect(() => {
        const loadPersistedData = async () => {
            try {
                const savedUser = await AsyncStorage.getItem("user");
                const savedSettings = await AsyncStorage.getItem("settings");
                
                if (savedUser) setUser(JSON.parse(savedUser));
                if (savedSettings) {
                    const parsed = JSON.parse(savedSettings);
                    if (parsed && typeof parsed === 'object') setSettings(parsed);
                }

                const [accRes, quoteRes] = await Promise.all([
                    axios.get(`${API_URL}/users`),
                    axios.get(`${API_URL}/quotes`)
                ]);
                
                if (accRes.data) setAccounts(Array.isArray(accRes.data) ? accRes.data : []);
                if (quoteRes.data) setQuotes(Array.isArray(quoteRes.data) ? quoteRes.data : []);
            } catch (err) {
                console.warn("Could not reach backend server for initial data. Check your config.js IP address.");
            }
        };
        loadPersistedData();
    }, []);

    // Load User-Specific Data
    useEffect(() => {
        const loadUserSpecificData = async () => {
            if (!user?.id) {
                setMoodHistory([]);
                setJournalEntries([]);
                return;
            }
            const cacheKey = `moodCache_${user.id}`;
            const journalKey = `journalCache_${user.id}`;
            try {
                const [moodRes, journalRes] = await Promise.all([
                    axios.get(`${API_URL}/moods?userId=${user.id}`),
                    axios.get(`${API_URL}/journals?userId=${user.id}`)
                ]);
                const moods = Array.isArray(moodRes.data) ? moodRes.data : [];
                const journals = Array.isArray(journalRes.data) ? journalRes.data : [];
                setMoodHistory(moods);
                setJournalEntries(journals);
                await AsyncStorage.setItem(cacheKey, JSON.stringify(moods));
                await AsyncStorage.setItem(journalKey, JSON.stringify(journals));
            } catch (err) {
                console.warn("Could not load user data from backend server.");
                try {
                    const [rawM, rawJ] = await Promise.all([
                        AsyncStorage.getItem(cacheKey),
                        AsyncStorage.getItem(journalKey)
                    ]);
                    if (rawM) setMoodHistory(JSON.parse(rawM));
                    if (rawJ) setJournalEntries(JSON.parse(rawJ));
                } catch (_) {}
            }
        };
        loadUserSpecificData();
    }, [user?.id]);

    // Theme Handler
    useEffect(() => {
        const subscription = Appearance.addChangeListener(({ colorScheme }) => {
            if (settings?.theme === 'system') {
                setIsDarkTheme(colorScheme === 'dark');
            }
        });

        if (settings?.theme === 'dark') setIsDarkTheme(true);
        else if (settings?.theme === 'light') setIsDarkTheme(false);
        else setIsDarkTheme(Appearance.getColorScheme() === 'dark');

        return () => subscription.remove();
    }, [settings.theme]);

    // Persistence
    useEffect(() => {
        AsyncStorage.setItem("settings", JSON.stringify(settings));
    }, [settings]);

    const login = async (userData) => {
        setUser(userData);
        await AsyncStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem("user");
    };

    const addMood = async (moodData) => {
        const moodEntry = { 
            userId: user?.id, 
            mood: moodData.emoji || moodData, 
            energy: moodData.energy ?? 50, 
            label: moodData.label || "Checked in" 
        };
        try {
            const res = await axios.post(`${API_URL}/moods`, moodEntry);
            const next = [res.data, ...moodHistory];
            setMoodHistory(next);
            if (user?.id) {
                AsyncStorage.setItem(`moodCache_${user.id}`, JSON.stringify(next)).catch(() => {});
            }
        } catch (err) {
            console.error("Error saving mood:", err);
            const optimistic = {
                id: `local_${Date.now()}`,
                ...moodEntry,
                createdAt: new Date().toISOString()
            };
            const next = [optimistic, ...moodHistory];
            setMoodHistory(next);
            if (user?.id) {
                AsyncStorage.setItem(`moodCache_${user.id}`, JSON.stringify(next)).catch(() => {});
                AsyncStorage.setItem(`moodPending_${user.id}`, JSON.stringify(optimistic)).catch(() => {});
            }
        }
    };

    const updateUserIdentity = async (email, identity) => {
        try {
            const res = await axios.put(`${API_URL}/users/${email}`, identity);
            const updatedUser = res.data;
            setUser(updatedUser);
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            return updatedUser;
        } catch (err) {
            console.error("Error updating user identity", err);
            throw err;
        }
    };

    const deleteAccount = async (email) => {
        if (email === "admin@mood.com") return;
        try {
            await axios.delete(`${API_URL}/users/${email}`);
            setAccounts(prev => prev.filter(acc => acc.email !== email));
        } catch (err) {
            console.error("Error deleting account", err);
        }
    };

    const toggleAccountRole = async (email) => {
        if (email === "admin@mood.com") return;
        const account = accounts.find(a => a.email === email);
        if (!account) return;
        const newRole = account.role === 'admin' ? 'user' : 'admin';
        try {
            await axios.put(`${API_URL}/users/${email}/role`, { role: newRole });
            setAccounts(prev => prev.map(acc =>
                acc.email === email ? { ...acc, role: newRole } : acc
            ));
        } catch (err) {
            console.error("Error updating role", err);
        }
    };

    const addJournalEntry = async (entry) => {
        try {
            const newEntry = { userId: user?.id, ...entry };
            const res = await axios.post(`${API_URL}/journals`, newEntry);
            setJournalEntries(prev => {
                const next = [res.data, ...prev];
                if (user?.id) AsyncStorage.setItem(`journalCache_${user.id}`, JSON.stringify(next)).catch(() => {});
                return next;
            });
        } catch (err) {
            console.error("Error saving journal:", err);
        }
    };

    const updateJournalEntry = async (id, updatedEntry) => {
        try {
            const res = await axios.put(`${API_URL}/journals/${id}`, updatedEntry);
            setJournalEntries(prev => {
                const next = prev.map(entry =>
                    entry.id === Number(id) ? res.data : entry
                );
                if (user?.id) AsyncStorage.setItem(`journalCache_${user.id}`, JSON.stringify(next)).catch(() => {});
                return next;
            });
        } catch (err) {
            console.error("Error updating journal:", err);
        }
    };

    const addQuote = async (text) => {
        if (!text || quotes.includes(text)) return;
        try {
            const res = await axios.post(`${API_URL}/quotes`, { text });
            setQuotes(prev => [res.data.text, ...prev]);
        } catch (err) {
            console.error("Error saving quote:", err);
        }
    };

    const clearAllData = async () => {
        await AsyncStorage.clear();
        setUser(null);
    };

    // Aura engine
    const [aura, setAura] = useState({
        name: "Neutral",
        color: theme.colors.primary,
        mode: "normal"
    });

    useEffect(() => {
        if (moodHistory.length > 0) {
            const last = moodHistory[0];
            if (!last) return; // Safer check
            const energy = last.energy !== undefined && last.energy !== null ? last.energy : 50;
            const mood = last.label || last.mood;

            const newAura = { 
                name: mood, 
                color: energy > 70 ? theme.colors.rose : (energy < 30 ? theme.colors.accent : theme.colors.success),
                mode: energy > 70 ? "high-energy" : (energy < 30 ? "low-energy" : "normal")
            };
            setAura(newAura);
        }
    }, [moodHistory]);

    const moodInsights = useMemo(() => {
        const streak = computeStreak(moodHistory);
        const weekly = computeWeeklySummary(moodHistory);
        const messages = generateInsightMessages(moodHistory);
        const badges = computeBadges(streak, moodHistory.length, journalEntries.length);
        return { streak, weekly, messages, badges };
    }, [moodHistory, journalEntries.length]);

    return (
        <MoodContext.Provider value={{
            user, setUser, login, logout,
            accounts, setAccounts, moodHistory, journalEntries, quotes,
            isDarkTheme, settings, setSettings,
            aura,
            moodInsights,
            addMood, addJournalEntry, updateJournalEntry,
            updateUserIdentity, clearAllData,
            deleteAccount, toggleAccountRole,
            addQuote
        }}>
            {children}
        </MoodContext.Provider>
    );
};
