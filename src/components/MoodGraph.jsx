import { useContext, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MoodContext } from "../context/MoodContext";
import Card from "./Card";

export default function MoodGraph() {
    const { moodHistory } = useContext(MoodContext);

    const moodScore = {
        "😀": 5, "✨": 5, // Excited/Happy
        "🙂": 4, "🌿": 4, "😌": 4, // Calm/Peaceful/Good
        "😐": 3, "☁️": 3, // Okay/Content
        "🙁": 2, "😰": 2, "😔": 2, // Anxious/Gloomy/Sad
        "😢": 1, "😤": 1, "😫": 1, // Angry/Stressed/Bad
    };

    const data = useMemo(() => {
        return moodHistory
            .slice(0, 10)
            .reverse()
            .map((entry) => ({
                timestamp: new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                day: new Date(entry.date).toLocaleDateString([], { weekday: 'short' }),
                score: moodScore[entry.mood] || 3,
                energy: (entry.energy ?? 50) / 20, // Scale 0-100 to 0-5
                rawEnergy: entry.energy ?? 50,
                mood: entry.mood,
                label: entry.label || "Check-in"
            }));
    }, [moodHistory]);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const entry = payload[0].payload;
            return (
                <div style={{
                    background: "rgba(255, 255, 255, 0.95)",
                    padding: "16px",
                    border: "1px solid rgba(255, 255, 255, 0.8)",
                    borderRadius: "20px",
                    boxShadow: "0 15px 35px rgba(0,0,0,0.12)",
                    color: "var(--text-main)",
                    backdropFilter: "blur(20px)",
                    textAlign: "center",
                    minWidth: "160px"
                }}>
                    <p style={{ margin: "0 0 12px", fontWeight: "900", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-sub)" }}>
                        {entry.day} • {entry.timestamp}
                    </p>

                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>{entry.mood}</div>
                    <div style={{ fontWeight: "900", fontSize: "18px", color: "var(--text-main)", marginBottom: "4px" }}>{entry.label}</div>

                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "800" }}>
                            <span style={{ color: "var(--text-sub)" }}>Mood Level</span>
                            <span style={{ color: "var(--primary)" }}>{entry.score}/5</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: "800" }}>
                            <span style={{ color: "var(--text-sub)" }}>Energy</span>
                            <span style={{ color: "var(--accent)" }}>{entry.rawEnergy}%</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (moodHistory.length < 2) {
        return (
            <Card title="Inner Rhythms">
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-sub)" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px", opacity: 0.5 }}>📊</div>
                    <p style={{ fontWeight: "800", color: "var(--text-main)", marginBottom: "8px" }}>Not enough data yet.</p>
                    <p style={{ fontSize: "14px", opacity: 0.7 }}>Complete more check-ins to unlock your kinetic trends!</p>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Inner Rhythms">
            <div style={{ width: "100%", height: 280, marginTop: "20px", position: "relative" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                        <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid stroke="var(--glass-border)" strokeDasharray="8 8" vertical={false} />
                        <XAxis
                            dataKey="day"
                            tick={{ fontSize: 11, fontWeight: "800", fill: "var(--text-sub)" }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 5]}
                            ticks={[1, 2, 3, 4, 5]}
                            tick={{ fontSize: 11, fontWeight: "800", fill: "var(--text-sub)" }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--glass-border)', strokeWidth: 2 }} />
                        <Area
                            name="Mood"
                            type="monotone"
                            dataKey="score"
                            stroke="var(--primary)"
                            strokeWidth={4}
                            fillOpacity={1}
                            fill="url(#colorMood)"
                            animationDuration={2000}
                            animationEasing="ease-in-out"
                            activeDot={{ r: 8, fill: "var(--primary)", stroke: "#fff", strokeWidth: 3 }}
                        />
                        <Area
                            name="Energy"
                            type="monotone"
                            dataKey="energy"
                            stroke="var(--accent)"
                            strokeWidth={3}
                            strokeDasharray="5 5"
                            fillOpacity={1}
                            fill="url(#colorEnergy)"
                            animationDuration={2500}
                            animationEasing="ease-in-out"
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "20px", paddingBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "900", color: "var(--text-main)" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--primary)" }} />
                    Mood Flow
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: "900", color: "var(--text-main)" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "var(--accent)", opacity: 0.6 }} />
                    Energy Wave
                </div>
            </div>
        </Card>
    );
}
