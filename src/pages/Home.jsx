import { useNavigate } from "react-router-dom";
import { useContext, useMemo } from "react";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Home() {
  const navigate = useNavigate();
  const { user, aura, moodHistory } = useContext(MoodContext);

  const lastMood = moodHistory[0];

  const features = [
    { name: "Emotion Rooms", desc: "Join support circles", path: "/rooms", icon: "💬", color: "#6c5ce7", priority: 2 },
    { name: "Mood Check-in", desc: "Track your journey", path: "/mood-check", icon: "📊", color: "#00cec9", priority: 3 },
    { name: "Journal", desc: "Write your thoughts", path: "/journal", icon: "📖", color: "#fdcb6e", priority: 2 },
    { name: "Motivation", desc: "Daily inspiration", path: "/motivation", icon: "✨", color: "#e84393", priority: 1 },
    { name: "Breathing", desc: "Relax & Focus", path: "/breathing", icon: "🌬️", color: "#a29bfe", priority: aura?.mode === "soothe" ? 5 : 2 },
  ];

  const prioritizedFeatures = useMemo(() => {
    return [...features].sort((a, b) => b.priority - a.priority);
  }, [aura]);

  return (
    <Layout title="">
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", gap: "2vh", overflow: "hidden", paddingBottom: "10vh" }}>

        {/* Dynamic Header Section - Compressed relative sizing */}
        <div style={{ textAlign: "center", position: "relative", flex: "0 0 auto", marginTop: "1vh", marginBottom: "1vh" }}>
          {/* Generative Kinetic Aura - Scaled down */}
          <div style={{
            width: "10vh",
            height: "10vh",
            minHeight: "50px",
            margin: "0 auto",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <svg viewBox="0 0 200 200" style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              filter: "blur(8px)",
              animation: "morphBlob 12s ease-in-out infinite alternate"
            }}>
              <defs>
                <linearGradient id="auraGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: aura?.color || "var(--primary)" }} />
                  <stop offset="100%" style={{ stopColor: "var(--accent)" }} />
                </linearGradient>
              </defs>
              <path fill="url(#auraGradient)" d="M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.6C86.3,-32.7,90.8,-17.7,89.5,-3C88.2,11.7,81.1,26,71.5,38.1C61.9,50.1,49.8,59.9,36.4,66.8C23,73.7,8.2,77.7,-6.6,76.5C-21.4,75.3,-36.2,68.9,-49.4,59.5C-62.7,50.1,-74.5,37.6,-80.1,23C-85.7,8.4,-85.1,-8.3,-79.9,-23.4C-74.8,-38.5,-65.1,-52.1,-52.1,-59.5C-39.1,-66.9,-22.8,-68.1,-7.2,-74.3C8.4,-80.5,16.8,-91.7,31.2,-91.5C45.6,-91.3,55.1,-79.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
            <div style={{ fontSize: "4vh", zIndex: 2, animation: "floatAvatar 6s ease-in-out infinite" }}>
              {lastMood?.mood || "✨"}
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(20px, 3.5vh, 32px)", margin: "0.5vh 0", color: "var(--text-main)", fontWeight: "900", letterSpacing: "-0.05em" }}>
            Hello, {user?.name || "Friend"}
          </h1>
          <p style={{ color: "var(--text-main)", opacity: 0.8, fontSize: "clamp(12px, 1.4vh, 15px)", margin: "0 auto", maxWidth: "400px", fontWeight: "400", lineHeight: "1.4" }}>
            {aura?.mode === "soothe" ? "Let's find some deep calm today." : "How shall we nourish your soul today?"}
          </p>
        </div>

        {/* Primary Action - Compressed */}
        <div style={{ flex: "0 0 auto" }}>
          <h3 style={{ marginBottom: "0.8vh", fontSize: "1.1vh", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-main)", opacity: 0.6, fontWeight: "800", paddingLeft: "8px" }}>Your Intent</h3>
          <Card
            onClick={() => navigate(prioritizedFeatures[0].path)}
            style={{
              padding: "1.5vh 2vh",
              border: `1px solid ${aura?.color}22`,
              display: "flex",
              alignItems: "center",
              gap: "2vh",
              boxShadow: "var(--shadow-md), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
              borderRadius: "20px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            {/* Soft Glow behind icon */}
            <div style={{ position: "absolute", width: "100px", height: "100px", background: `radial-gradient(circle, ${prioritizedFeatures[0].color}40 0%, transparent 70%)`, left: "-20px", top: "-20px", pointerEvents: "none" }} />

            <div style={{ fontSize: "4vh", display: "flex", alignItems: "center", justifyContent: "center", width: "6vh", height: "6vh", background: "rgba(255,255,255,0.1)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.2)", zIndex: 1 }}>{prioritizedFeatures[0].icon}</div>
            <div style={{ flex: 1, zIndex: 1 }}>
              <h2 style={{ margin: "0 0 0.3vh", fontSize: "clamp(16px, 2vh, 22px)", fontWeight: "900", letterSpacing: "-0.02em" }}>{prioritizedFeatures[0].name}</h2>
              <p style={{ margin: 0, color: "var(--text-main)", opacity: 0.7, fontSize: "clamp(11px, 1.3vh, 14px)", fontWeight: "500" }}>{prioritizedFeatures[0].desc}</p>
            </div>
          </Card>
        </div>

        {/* Narrative Feature List - Grid to prevent scrolling */}
        <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <h3 style={{ marginBottom: "0.8vh", fontSize: "1.1vh", textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-main)", opacity: 0.6, fontWeight: "800", paddingLeft: "8px" }}>Discover More</h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5vh",
            minHeight: 0
          }}>
            {prioritizedFeatures.slice(1, 5).map((f, index) => (
              <div key={f.name} className="stagger-item" style={{ animationDelay: `${(index + 1) * 0.1}s`, minHeight: 0 }}>
                <Card
                  onClick={() => navigate(f.path)}
                  style={{
                    padding: "1.5vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    borderRadius: "20px",
                    border: "1px solid var(--glass-border)",
                    boxSizing: "border-box",
                    minHeight: 0,
                    gap: "1vh",
                    boxShadow: "var(--shadow-md), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  {/* Subtle corner glow */}
                  <div style={{ position: "absolute", width: "80px", height: "80px", background: `radial-gradient(circle, ${f.color}30 0%, transparent 70%)`, right: "-20px", bottom: "-20px", pointerEvents: "none" }} />

                  <div style={{
                    width: "4vh",
                    height: "4vh",
                    minHeight: "32px",
                    minWidth: "32px",
                    borderRadius: "12px",
                    background: `rgba(255,255,255,0.1)`,
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: f.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "2vh",
                    boxShadow: `0 4px 10px ${f.color}20`,
                    zIndex: 1
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ overflow: "hidden", width: "100%", zIndex: 1 }}>
                    <h4 style={{ margin: "0 0 0.3vh", fontSize: "clamp(13px, 1.6vh, 18px)", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</h4>
                    <p style={{ margin: 0, fontSize: "clamp(11px, 1.2vh, 13px)", color: "var(--text-main)", opacity: 0.7, fontWeight: "500", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{f.desc}</p>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes morphBlob {
              0% { d: path("M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.6C86.3,-32.7,90.8,-17.7,89.5,-3C88.2,11.7,81.1,26,71.5,38.1C61.9,50.1,49.8,59.9,36.4,66.8C23,73.7,8.2,77.7,-6.6,76.5C-21.4,75.3,-36.2,68.9,-49.4,59.5C-62.7,50.1,-74.5,37.6,-80.1,23C-85.7,8.4,-85.1,-8.3,-79.9,-23.4C-74.8,-38.5,-65.1,-52.1,-52.1,-59.5C-39.1,-66.9,-22.8,-68.1,-7.2,-74.3C8.4,-80.5,16.8,-91.7,31.2,-91.5C45.6,-91.3,55.1,-79.6,44.7,-76.4Z"); }
          50% { d: path("M52.1,-82.1C65.3,-74.6,72.1,-56.3,77.1,-39.8C82,-23.3,85.2,-8.5,82.4,5.4C79.6,19.3,70.9,32.3,60.8,43.7C50.7,55.1,39.3,64.9,25.4,72.4C11.5,79.9,-4.9,85.1,-21.8,83.4C-38.7,81.7,-56.1,73.1,-67.2,59.5C-78.3,45.9,-83.1,27.3,-84.9,8.5C-86.7,-10.3,-85.5,-29.2,-76.5,-44.6C-67.5,-60,-50.7,-71.8,-34.5,-77.8C-18.3,-83.8,-2.7,-84,-2.7,-84.1C2.7,-84.2,18.3,-83.8,32.1,-83.4C45.9,-83,52.1,-82.1,52.1,-82.1Z"); }
          100% { d: path("M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.6C86.3,-32.7,90.8,-17.7,89.5,-3C88.2,11.7,81.1,26,71.5,38.1C61.9,50.1,49.8,59.9,36.4,66.8C23,73.7,8.2,77.7,-6.6,76.5C-21.4,75.3,-36.2,68.9,-49.4,59.5C-62.7,50.1,-74.5,37.6,-80.1,23C-85.7,8.4,-85.1,-8.3,-79.9,-23.4C-74.8,-38.5,-65.1,-52.1,-52.1,-59.5C-39.1,-66.9,-22.8,-68.1,-7.2,-74.3C8.4,-80.5,16.8,-91.7,31.2,-91.5C45.6,-91.3,55.1,-79.6,44.7,-76.4Z"); }
            }
        @keyframes floatAvatar {
              0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
          100% { transform: translateY(0px) rotate(0deg); }
            }
              `}</style>
    </Layout>
  );
}
