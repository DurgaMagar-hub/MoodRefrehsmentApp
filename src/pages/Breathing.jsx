import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";
import { useNavigate } from "react-router-dom";

const TECHNIQUES = [
    {
        id: "box",
        name: "Box Breathing",
        description: "Navy SEAL focus. Equal parts for mental resilience.",
        pattern: [4000, 4000, 4000, 4000],
        labels: ["Inhale", "Hold", "Exhale", "Hold"],
        icon: "⬛",
        color: "#a29bfe"
    },
    {
        id: "478",
        name: "4-7-8 Relax",
        description: "Anxiety relief. A natural reset for the spirit.",
        pattern: [4000, 7000, 8000, 0],
        labels: ["Inhale", "Hold", "Exhale", ""],
        icon: "🌙",
        color: "#74b9ff"
    },
    {
        id: "vagus",
        name: "Vagus Release",
        description: "Deep relaxation. Twice as much out than in.",
        pattern: [4000, 0, 8000, 0],
        labels: ["Inhale", "", "Exhale", ""],
        icon: "🌊",
        color: "#55efc4"
    },
    {
        id: "coherent",
        name: "Coherence",
        description: "Heart balance. Restoring your internal rhythm.",
        pattern: [5000, 0, 5000, 0],
        labels: ["Inhale", "", "Exhale", ""],
        icon: "⚖️",
        color: "#81ecec"
    },
    {
        id: "soma",
        name: "Soma Rhythm",
        description: "Energizing breath. Ignite your focus rapidly.",
        pattern: [2000, 0, 2000, 0],
        labels: ["Inhale", "", "Exhale", ""],
        icon: "⚡",
        color: "#fd79a8"
    }
];

export default function Breathing() {
    const navigate = useNavigate();
    const [selectedTechnique, setSelectedTechnique] = useState(null);
    const [stageIndex, setStageIndex] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [progress, setProgress] = useState(0);

    const timeoutRef = useRef(null);
    const frameRef = useRef(null);

    useEffect(() => {
        if (!isActive || !selectedTechnique) return;

        const runCycle = (index) => {
            const duration = selectedTechnique.pattern[index];
            if (duration === 0) {
                runCycle((index + 1) % 4);
                return;
            }

            setStageIndex(index);
            const startTime = Date.now();

            const updateProgress = () => {
                const elapsed = Date.now() - startTime;
                const p = Math.min(elapsed / duration, 1);
                setProgress(p);
                if (p < 1) {
                    frameRef.current = requestAnimationFrame(updateProgress);
                }
            };

            frameRef.current = requestAnimationFrame(updateProgress);

            timeoutRef.current = setTimeout(() => {
                runCycle((index + 1) % 4);
            }, duration);
        };

        runCycle(0);

        return () => {
            clearTimeout(timeoutRef.current);
            cancelAnimationFrame(frameRef.current);
        };
    }, [isActive, selectedTechnique]);

    const handleStart = (tech) => {
        setSelectedTechnique(tech);
        setIsActive(true);
        setStageIndex(0);
    };

    const handleStop = () => {
        setIsActive(false);
        setSelectedTechnique(null);
        clearTimeout(timeoutRef.current);
        cancelAnimationFrame(frameRef.current);
    };

    const currentLabel = selectedTechnique ? selectedTechnique.labels[stageIndex] : "";

    const getScale = () => {
        if (!isActive) return 1;
        if (stageIndex === 0) return 1.4; // Inhale
        if (stageIndex === 1) return 1.4; // Inhale Hold
        if (stageIndex === 2) return 0.8; // Exhale
        return 0.8;                       // Exhale Hold
    };

    if (!selectedTechnique) {
        return (
            <Layout title="Breathing Sanctuary">
                <div style={{ padding: "10px" }}>
                    <div style={{ textAlign: "center", marginBottom: "32px" }}>
                        <h2 style={{ fontSize: "32px", fontWeight: "900", color: "var(--text-main)", letterSpacing: "-0.04em", margin: "0 0 8px" }}>Deepen your Presence</h2>
                        <p style={{ color: "var(--text-sub)", fontWeight: "500" }}>Choose a path to restore your inner balance.</p>
                    </div>

                    <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }}>
                        {TECHNIQUES.map((t, idx) => (
                            <Card
                                key={t.id}
                                onClick={() => handleStart(t)}
                                className="stagger-item"
                                style={{
                                    cursor: "pointer",
                                    animationDelay: `${idx * 0.1}s`,
                                    padding: "20px",
                                    border: "1px solid var(--glass-border)",
                                    background: "rgba(255,255,255,0.4)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "20px",
                                    borderRadius: "24px",
                                    position: "relative",
                                    overflow: "hidden"
                                }}
                            >
                                <div style={{ fontSize: "28px", width: "56px", height: "56px", background: `${t.color}22`, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${t.color}44` }}>
                                    {t.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: "0 0 4px", fontSize: "18px", fontWeight: "900", color: "var(--text-main)" }}>{t.name}</h3>
                                    <p style={{ margin: 0, color: "var(--text-sub)", fontSize: "13px", fontWeight: "500", lineHeight: "1.4" }}>{t.description}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </Layout>
        );
    }

    const circleColor = selectedTechnique.color;
    const currentDuration = selectedTechnique.pattern[stageIndex] / 1000;

    return (
        <Layout title="">
            <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "80vh",
                textAlign: "center",
                background: `radial-gradient(circle at center, ${circleColor}11 0%, transparent 70%)`,
                transition: "background 2s ease"
            }}>
                <div style={{ width: "320px", height: "320px", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "60px" }}>

                    {/* Ring Progress Overlay */}
                    <svg style={{ position: "absolute", width: "100%", height: "100%", transform: "rotate(-90deg)", zIndex: 1 }}>
                        <circle
                            cx="160" cy="160" r="145"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="4"
                        />
                        <circle
                            cx="160" cy="160" r="145"
                            fill="none"
                            stroke={circleColor}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 145}
                            strokeDashoffset={2 * Math.PI * 145 * (1 - progress)}
                            style={{ transition: "stroke-dashoffset 0.1s linear" }}
                        />
                    </svg>

                    {/* Outer Glow Halo */}
                    <div style={{
                        position: "absolute",
                        width: "80%",
                        height: "80%",
                        borderRadius: "50%",
                        background: circleColor,
                        filter: "blur(40px)",
                        opacity: 0.3,
                        transform: `scale(${getScale()})`,
                        transition: `transform ${currentDuration}s ease-in-out`
                    }} />

                    {/* Middle Pulse Ring */}
                    <div style={{
                        position: "absolute",
                        width: "60%",
                        height: "60%",
                        borderRadius: "50%",
                        background: `${circleColor}22`,
                        border: `1px solid ${circleColor}44`,
                        transform: `scale(${getScale() * 1.15})`,
                        transition: `transform ${currentDuration}s ease-in-out`,
                        zIndex: 2
                    }} />

                    {/* Core Container */}
                    <Card style={{
                        width: "50%",
                        height: "50%",
                        borderRadius: "50%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,255,255,0.8)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(255,255,255,0.5)",
                        transform: `scale(${getScale()})`,
                        transition: `transform ${currentDuration}s ease-in-out`,
                        zIndex: 3,
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1), inset 0 1px 2px white"
                    }}>
                        <div style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "2px", textTransform: "uppercase", color: "var(--text-sub)", marginBottom: "4px" }}>
                            {selectedTechnique.name}
                        </div>
                        <h2 style={{ fontSize: "32px", fontWeight: "900", color: circleColor, margin: 0, letterSpacing: "-0.02em" }}>
                            {currentLabel}
                        </h2>
                    </Card>
                </div>

                <div style={{ maxWidth: "280px", marginBottom: "40px" }}>
                    <p style={{ color: "var(--text-main)", fontWeight: "800", fontSize: "18px", opacity: 0.9 }}>{selectedTechnique.description}</p>
                </div>

                <div style={{ display: "flex", gap: "16px" }}>
                    <Button onClick={handleStop} variant="outline" style={{ borderRadius: "20px", fontWeight: "800" }}>Change Path</Button>
                    <Button onClick={() => navigate("/home")} variant="ghost" style={{ borderRadius: "20px", fontWeight: "800", color: "var(--danger)" }}>End Session</Button>
                </div>
            </div>

            <style>{`
                .stagger-item {
                    animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    opacity: 0;
                }
                @keyframes slideRight {
                    from { transform: translateX(-30px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}</style>
        </Layout>
    );
}
