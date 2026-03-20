import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const MoodContext = createContext();

const API_URL = "http://localhost:3001/api";

export const MoodProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedLocal = localStorage.getItem("user");
        const savedSession = sessionStorage.getItem("user");
        return (savedLocal ? JSON.parse(savedLocal) : (savedSession ? JSON.parse(savedSession) : null));
    });

    const [accounts, setAccounts] = useState([]);
    const [moodHistory, setMoodHistory] = useState([]);
    const [journalEntries, setJournalEntries] = useState([]);
    const [quotes, setQuotes] = useState([]);
    
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem("settings");
        return saved ? JSON.parse(saved) : { theme: 'system', notifications: true };
    });

    const [isDarkTheme, setIsDarkTheme] = useState(false);

    // Initial Data Fetch from SQL Database
    useEffect(() => {
        const loadSQLData = async () => {
            try {
                const [accRes, moodRes, journalRes, quoteRes] = await Promise.all([
                    axios.get(`${API_URL}/users`),
                    axios.get(`${API_URL}/moods`),
                    axios.get(`${API_URL}/journals`),
                    axios.get(`${API_URL}/quotes`)
                ]);
                setAccounts(accRes.data);
                setMoodHistory(moodRes.data);
                setJournalEntries(journalRes.data);
                setQuotes(quoteRes.data);
            } catch (err) {
                console.error("Failed to load SQL data:", err);
            }
        };
        loadSQLData();
    }, []);

    // Theme Handler
    useEffect(() => {
        const applyTheme = (themeStr) => {
            let isDarkNow = false;
            if (themeStr === 'dark') {
                isDarkNow = true;
            } else if (themeStr === 'light') {
                isDarkNow = false;
            } else {
                if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    isDarkNow = true;
                } else {
                    isDarkNow = false;
                }
            }

            setIsDarkTheme(isDarkNow);
            if (isDarkNow) {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }
        };

        const currentTheme = settings.theme || 'system';
        applyTheme(currentTheme);

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
            if (currentTheme === 'system') applyTheme('system');
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [settings.theme]);

    // Save strictly local settings
    useEffect(() => {
        localStorage.setItem("settings", JSON.stringify(settings));
    }, [settings]);

    // Authentication
    const login = (userData, stayLoggedIn) => {
        setUser(userData);
        if (stayLoggedIn) {
            localStorage.setItem("user", JSON.stringify(userData));
            sessionStorage.removeItem("user");
        } else {
            sessionStorage.setItem("user", JSON.stringify(userData));
            localStorage.removeItem("user");
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        sessionStorage.removeItem("user");
    };

    const clearAllData = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    };

    // SQL Mutations
    const addMood = async (moodData) => {
        const moodEntry = typeof moodData === 'string'
            ? { userId: user?.id, mood: moodData, energy: 50, label: "Checked in" }
            : { userId: user?.id, mood: moodData.emoji, energy: moodData.energy, label: moodData.label };

        try {
            const res = await axios.post(`${API_URL}/moods`, moodEntry);
            setMoodHistory([res.data, ...moodHistory]);
        } catch (err) {
            console.error("Error saving mood to DB", err);
        }
    };

    const addJournalEntry = async (entry) => {
        try {
            const newEntry = { userId: user?.id, title: entry.title, content: entry.content, mood: entry.mood || "Neutral" };
            const res = await axios.post(`${API_URL}/journals`, newEntry);
            setJournalEntries([res.data, ...journalEntries]);
        } catch (err) {
            console.error("Error saving journal to DB", err);
        }
    };

    const updateJournalEntry = async (id, updatedEntry) => {
        try {
            const res = await axios.put(`${API_URL}/journals/${id}`, updatedEntry);
            setJournalEntries(journalEntries.map(entry =>
                entry.id === Number(id) ? res.data : entry
            ));
        } catch (err) {
            console.error("Error updating journal in DB", err);
        }
    };

    const addQuote = async (text) => {
        if (!text || quotes.includes(text)) return;
        try {
            const res = await axios.post(`${API_URL}/quotes`, { text });
            setQuotes([res.data.text, ...quotes]);
        } catch (err) {
            console.error("Error saving quote to DB", err);
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

    // Aura engine
    const [aura, setAura] = useState({
        name: "Neutral",
        color: "#6c5ce7",
        gradient: "linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%)",
        mode: "normal"
    });

    useEffect(() => {
        if (moodHistory.length > 0) {
            const last = moodHistory[0];
            const energy = last.energy !== undefined && last.energy !== null ? last.energy : 50;
            const mood = last.label || last.mood;

            let theme = { name: mood, mode: "normal" };

            if (energy > 70) {
                theme.color = "#fd79a8";
                theme.gradient = "linear-gradient(135deg, #fd79a8 0%, #fab1a0 100%)";
                theme.mode = "high-energy";
            } else if (energy < 30) {
                theme.color = "#74b9ff";
                theme.gradient = "linear-gradient(135deg, #74b9ff 0%, #a29bfe 100%)";
                theme.mode = "low-energy";
            } else if (mood === "Stressed" || mood === "Anxious") {
                theme.color = "#ff7675";
                theme.gradient = "linear-gradient(135deg, #ff7675 0%, #fdcb6e 100%)";
                theme.mode = "soothe";
            } else {
                theme.color = "#55efc4";
                theme.gradient = "linear-gradient(135deg, #55efc4 0%, #81ecec 100%)";
            }
            setAura(theme);
        }
    }, [moodHistory]);

    return (
        <MoodContext.Provider value={{
            user, setUser, login, logout,
            accounts, setAccounts, deleteAccount, toggleAccountRole,
            settings, setSettings,
            aura, isDarkTheme,
            clearAllData,
            moodHistory, addMood,
            journalEntries, addJournalEntry, updateJournalEntry,
            quotes, addQuote
        }}>
            {children}
        </MoodContext.Provider>
    );
};
