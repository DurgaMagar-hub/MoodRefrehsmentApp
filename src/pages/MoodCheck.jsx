import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import Card from "../components/Card";

export default function MoodCheck() {
  const navigate = useNavigate();
  const { addMood } = useContext(MoodContext);

  const [step, setStep] = useState(1);
  const [energy, setEnergy] = useState(50);
  const [selectedMood, setSelectedMood] = useState(null);

  const moodSpectrum = [
    { label: "Peaceful", color: "#a29bfe", emoji: "😌", energyRange: [0, 40] },
    { label: "Gloomy", color: "#74b9ff", emoji: "😔", energyRange: [0, 30] },
    { label: "Calm", color: "#55efc4", emoji: "🌿", energyRange: [10, 50] },
    { label: "Stressed", color: "#fab1a0", emoji: "😫", energyRange: [60, 100] },
    { label: "Anxious", color: "#ffeaa7", emoji: "😰", energyRange: [50, 90] },
    { label: "Excited", color: "#fd79a8", emoji: "✨", energyRange: [70, 100] },
    { label: "Angry", color: "#ff7675", emoji: "😤", energyRange: [80, 100] },
    { label: "Content", color: "#81ecec", emoji: "☁️", energyRange: [30, 70] },
  ];

  const filteredMoods = moodSpectrum.filter(m =>
    energy >= m.energyRange[0] && energy <= m.energyRange[1]
  );

  const bgColor = selectedMood ? `${selectedMood.color}15` : `rgba(255,255,255,0.05)`;

  const handleFinish = () => {
    if (selectedMood) {
      addMood({ ...selectedMood, energy });
      setStep(4);
    }
  };

  return (
    <Layout showNav={step < 4} title={step === 4 ? "" : "Check-in"}>
      <div style={{
        minHeight: "75vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        padding: "24px",
        borderRadius: "40px",
        background: bgColor,
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--shadow-lg), inset 0 1px 2px rgba(255,255,255,0.3)"
      }}>

        {/* Dynamic Energy Aura / Pulse Gauge */}
        <div style={{
          position: "absolute",
          width: `${150 + (energy * 2.5)}px`,
          height: `${150 + (energy * 2.5)}px`,
          background: selectedMood ? `${selectedMood.color}33` : `hsla(${20 + (energy * 0.5)}, 100%, 70%, 0.15)`,
          filter: "blur(80px)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)",
          zIndex: 0,
          opacity: step > 1 ? 1 : 0
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {step === 1 && (
            <div className="animate-fade-in" style={{ textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: "64px", marginBottom: "24px", animation: "slow-bounce 3s infinite ease-in-out" }}>✨</div>
              <h1 style={{ fontSize: "36px", marginBottom: "16px", color: "var(--text-main)", fontWeight: "900", letterSpacing: "-0.04em" }}>Take a Moment</h1>
              <p style={{ color: "var(--text-sub)", fontSize: "19px", lineHeight: "1.6", marginBottom: "40px", maxWidth: "280px", marginInline: "auto" }}>
                Let's check in with how your "inner battery" is performing right now.
              </p>
              <Button size="large" onClick={() => setStep(2)} style={{ padding: "18px 48px", borderRadius: "20px", boxShadow: "0 10px 25px rgba(255, 126, 95, 0.3)" }}>I'm Ready</Button>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in" style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "28px", fontWeight: "800", marginBottom: "8px", color: "var(--text-main)" }}>Energy Check</h2>
              <p style={{ color: "var(--text-sub)", marginBottom: "60px" }}>How are you vibrating today?</p>

              {/* Enhanced Slider UI */}
              <div style={{ marginBottom: "60px", padding: "0 10px", position: "relative" }}>
                <div style={{
                  fontSize: "48px",
                  fontWeight: "900",
                  color: "var(--text-main)",
                  marginBottom: "20px",
                  textShadow: "0 4px 10px rgba(0,0,0,0.05)"
                }}>{energy}%</div>

                <input
                  type="range"
                  min="0" max="100"
                  value={energy}
                  onChange={(e) => setEnergy(parseInt(e.target.value))}
                  style={sliderStyle}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", color: "var(--text-main)", fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px" }}>
                  <span>Low</span>
                  <span style={{ opacity: 0.7 }}>Battery</span>
                  <span>High</span>
                </div>
              </div>

              <Button onClick={() => setStep(3)} variant="primary" style={{ width: "160px" }}>Next Step</Button>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in" style={{ width: "100%" }}>
              <h2 style={{ textAlign: "center", marginBottom: "32px", fontSize: "24px", fontWeight: "800" }}>Which one resonates?</h2>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                maxHeight: "380px",
                overflowY: "auto",
                padding: "8px",
                scrollbarWidth: "none"
              }}>
                {filteredMoods.map((m, idx) => (
                  <button
                    key={m.label}
                    className="stagger-item"
                    onClick={() => setSelectedMood(m)}
                    style={{
                      animationDelay: `${idx * 0.05}s`,
                      padding: "24px 16px",
                      borderRadius: "28px",
                      border: "1px solid",
                      borderColor: selectedMood?.label === m.label ? "var(--glass-border)" : "transparent",
                      background: selectedMood?.label === m.label ? "white" : "rgba(255,255,255,0.3)",
                      color: "var(--text-main)",
                      cursor: "pointer",
                      transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                      textAlign: "center",
                      boxShadow: selectedMood?.label === m.label
                        ? `0 15px 30px ${m.color}33, inset 0 1px 1px rgba(255,255,255,0.8)`
                        : "var(--shadow-sm)",
                      transform: selectedMood?.label === m.label ? "scale(1.05) translateY(-5px)" : "scale(1)"
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "12px", filter: selectedMood?.label === m.label ? "none" : "grayscale(0.3)" }}>{m.emoji}</div>
                    <div style={{ fontWeight: "900", fontSize: "16px", color: "var(--text-main)", opacity: selectedMood?.label === m.label ? 1 : 0.85 }}>{m.label}</div>
                    {selectedMood?.label === m.label && (
                      <div style={{ width: "6px", height: "6px", background: m.color, borderRadius: "50%", margin: "8px auto 0" }} />
                    )}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: "32px", textAlign: "center" }}>
                <Button disabled={!selectedMood} onClick={handleFinish} fullWidth style={{ height: "60px", borderRadius: "20px" }}>Preserve this Feeling</Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in" style={{ textAlign: "center" }}>
              <div style={{
                fontSize: "84px",
                marginBottom: "24px",
                filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.15))",
                animation: "float-emoji 4s infinite ease-in-out"
              }}>{selectedMood?.emoji}</div>

              <h2 style={{ fontSize: "36px", marginBottom: "12px", fontWeight: "900", letterSpacing: "-0.05em", color: "var(--text-main)" }}>Acknowledged.</h2>
              <p style={{ color: "var(--text-main)", marginBottom: "40px", fontSize: "18px", lineHeight: "1.6", fontWeight: "700" }}>
                You identified as feeling <span style={{ color: "#1a1a1a", fontWeight: "900", borderBottom: `4px solid ${selectedMood?.color || "gray"}` }}>{selectedMood?.label}</span>. <br />
                <span style={{ opacity: 0.8 }}>Your state has been gently recorded.</span>
              </p>

              <Card style={{
                textAlign: "left",
                marginBottom: "40px",
                borderRadius: "32px",
                border: `1px solid ${selectedMood?.color}55`,
                background: `linear-gradient(135deg, rgba(255,255,255,1) 0%, ${selectedMood?.color}22 100%)`,
                backdropFilter: "blur(20px)",
                padding: "24px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.05), inset 0 1px 2px rgba(255,255,255,0.5)"
              }}>
                <h4 style={{ margin: "0 0 14px", fontSize: "13px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "1.5px", color: selectedMood?.color }}>Daily Insight</h4>
                <p style={{ margin: 0, fontSize: "17px", color: "var(--text-main)", fontWeight: "700", lineHeight: "1.6", letterSpacing: "-0.01em" }}>
                  {energy < 40 ?
                    "Your battery needs a recharge. Give yourself permission to do absolutely nothing for 15 minutes." :
                    "You have high vibrational energy today. It's a perfect window for creative expression."}
                </p>
              </Card>

              <h3 style={{ fontSize: "14px", fontWeight: "900", textTransform: "uppercase", color: "var(--text-main)", letterSpacing: "2px", marginBottom: "20px", opacity: 0.8 }}>GUIDED PATHS</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "40px" }}>
                <Card
                  onClick={() => navigate("/journal/new")}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "24px 16px",
                    borderRadius: "28px",
                    background: "linear-gradient(135deg, #ffffff 0%, #f1f7ff 100%)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.03)",
                    transition: "transform 0.3s ease"
                  }}
                  className="hover-scale"
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🖋️</div>
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "#4834d4" }}>Journal</div>
                </Card>
                <Card
                  onClick={() => navigate("/breathing")}
                  style={{
                    cursor: "pointer",
                    textAlign: "center",
                    padding: "24px 16px",
                    borderRadius: "28px",
                    background: "linear-gradient(135deg, #ffffff 0%, #f0fffb 100%)",
                    boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.03)",
                    transition: "transform 0.3s ease"
                  }}
                  className="hover-scale"
                >
                  <div style={{ fontSize: "36px", marginBottom: "10px" }}>🌬️</div>
                  <div style={{ fontSize: "15px", fontWeight: "900", color: "#00b894" }}>Breathe</div>
                </Card>
              </div>

              <div style={{ padding: "0 20px" }}>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/home")}
                  style={{
                    fontWeight: "800",
                    borderRadius: "24px",
                    height: "54px",
                    width: "100%",
                    border: "1px solid var(--glass-border)",
                    background: "rgba(255,255,255,0.5)",
                    color: "var(--text-main)",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  Close Flow
                </Button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes slow-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
          }
          @keyframes float-emoji {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          input[type=range] {
            -webkit-appearance: none;
            width: 100%;
            background: transparent;
          }
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 32px;
            width: 32px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1), 0 0 0 6px hsla(${(energy * 0.5) + 20}, 100%, 70%, 0.3);
            border: 2px solid #FF7E5F;
            margin-top: -12px;
            transition: all 0.2s ease;
          }
          input[type=range]::-webkit-slider-thumb:active {
            transform: scale(1.2);
            box-shadow: 0 8px 20px rgba(0,0,0,0.15), 0 0 0 10px hsla(${(energy * 0.5) + 20}, 100%, 70%, 0.4);
          }
          input[type=range]::-webkit-slider-runnable-track {
            width: 100%;
            height: 8px;
            cursor: pointer;
            background: linear-gradient(to right, #74b9ff, #FF7E5F, #fd79a8);
            border-radius: 10px;
          }
          .stagger-item {
            animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </Layout>
  );
}

const sliderStyle = {
  width: "100%",
  WebkitAppearance: "none",
  height: "8px",
  borderRadius: "5px",
  background: "#dfe6e9",
  outline: "none",
};

