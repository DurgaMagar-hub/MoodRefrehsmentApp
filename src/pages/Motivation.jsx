import { useContext, useState } from "react";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Motivation() {
  const { quotes, addQuote } = useContext(MoodContext);
  const [newQuote, setNewQuote] = useState("");

  const handleAddStart = () => {
    if (newQuote.trim()) {
      addQuote(newQuote.trim());
      setNewQuote("");
    }
  };

  return (
    <Layout title="Daily Inspiration">
      <style>{`
        .quote-card {
            position: relative;
            overflow: hidden;
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .quote-card:hover {
            transform: translateY(-5px) scale(1.01);
            box-shadow: 0 30px 60px rgba(0,0,0,0.15);
        }
        .gradient-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(40px);
            z-index: 0;
            animation: floatOrb 10s infinite alternate ease-in-out;
            pointer-events: none;
        }
        @keyframes floatOrb {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(20px, 30px) scale(1.2); }
        }
        
        .quote-list-item {
            transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            border-left: 4px solid transparent;
        }
        .quote-list-item:hover {
            transform: translateX(8px);
            border-left-color: var(--primary);
            background: rgba(255,255,255,0.6);
        }
        
        .dark-theme .quote-list-item:hover {
            background: rgba(255,255,255,0.1);
        }

        .add-quote-container:focus-within {
            box-shadow: 0 0 0 3px var(--primary-glow), var(--shadow-md);
            border-color: var(--primary);
        }
      `}</style>

      <div className="stagger-item" style={{ animationDelay: "0.1s" }}>
        {/* Quote of the Day Card */}
        <Card className="quote-card" style={{
          background: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
        color: "white",
        marginTop: "24px",
        marginBottom: "40px",
        padding: "40px 32px",
        borderRadius: "32px",
        boxShadow: "0 20px 40px rgba(255, 126, 95, 0.4)",
        border: "none",
        position: "relative",
        flexShrink: 0
      }}>
          <div style={{ position: "relative", zIndex: 10 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255,255,255,0.25)",
              padding: "8px 16px",
              borderRadius: "20px",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.3)",
              marginBottom: "24px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              <span style={{ fontSize: "16px" }}>✨</span>
              <span style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", color: "white" }}>Quote of the Day</span>
            </div>

            <h2 style={{ fontSize: "28px", fontStyle: "italic", margin: "0 0 28px 0", fontWeight: "500", lineHeight: "1.5", fontFamily: "'Playfair Display', Georgia, serif", color: "#ffffff", letterSpacing: "0.3px", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
              "Happiness is not something ready made. It comes from your own actions."
            </h2>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.9 }}>
              <div style={{ width: "32px", height: "2px", background: "#ffffff", borderRadius: "2px", opacity: 0.8 }} />
              <span style={{ fontSize: "15px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1.5px", color: "#ffffff" }}>Dalai Lama</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Add New Quote Section */}
      <div className="stagger-item" style={{ marginBottom: "48px", flexShrink: 0, animationDelay: "0.2s", position: "relative" }}>
        {/* Ambient Glow */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "80%", height: "80%", background: "var(--primary-glow)", filter: "blur(60px)", opacity: 0.5, pointerEvents: "none", zIndex: 0 }} />

        <h3 style={{ position: "relative", zIndex: 1, margin: "0 0 16px 8px", fontSize: "22px", color: "var(--text-main)", fontWeight: "700", letterSpacing: "-0.03em" }}>Save an Inspiration</h3>
        <div className="add-quote-container" style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: "12px",
          background: "var(--card-bg)",
          backdropFilter: "blur(20px)",
          padding: "8px 8px 8px 24px",
          borderRadius: "24px",
          boxShadow: "var(--shadow-sm)",
          border: "1px solid var(--glass-border)",
          transition: "all 0.3s ease"
        }}>
          <input
            placeholder="Type a quote that moves you..."
            value={newQuote}
            onChange={(e) => setNewQuote(e.target.value)}
            style={{
              flex: 1,
              padding: "16px 0",
              border: "none",
              fontSize: "18px",
              outline: "none",
              color: "var(--text-main)",
              background: "transparent",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontWeight: "500",
              letterSpacing: "0.3px",
              opacity: 0.9
            }}
          />
          <Button
            onClick={handleAddStart}
            disabled={!newQuote.trim()}
            style={{
              padding: "0 32px",
              borderRadius: "18px",
              background: newQuote.trim() ? "var(--primary)" : "rgba(0,0,0,0.05)",
              color: newQuote.trim() ? "white" : "var(--text-sub)",
              fontWeight: "700",
              letterSpacing: "0.5px",
              boxShadow: newQuote.trim() ? "0 8px 20px var(--primary-glow)" : "none",
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              border: "none",
              cursor: newQuote.trim() ? "pointer" : "not-allowed",
              opacity: newQuote.trim() ? 1 : 0.6
            }}
          >
            Save
          </Button>
        </div>
      </div>

      {/* Collection Section */}
      <div className="stagger-item" style={{ animationDelay: "0.3s" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "0 8px", flexShrink: 0 }}>
          <h3 style={{ margin: 0, fontSize: "22px", color: "var(--text-main)", fontWeight: "700", letterSpacing: "-0.03em" }}>Your Vault</h3>
          <span style={{ fontSize: "14px", color: "var(--text-main)", opacity: 0.6, fontWeight: "700", background: "var(--glass-border)", padding: "4px 12px", borderRadius: "12px" }}>
            {quotes.length} saved
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "40px", flexShrink: 0 }}>
          {quotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", opacity: 0.5 }}>
              <div style={{ fontSize: "40px", marginBottom: "16px" }}>🪶</div>
              <p style={{ margin: 0, fontSize: "16px", fontWeight: "500", fontStyle: "italic", fontFamily: "'Playfair Display', Georgia, serif" }}>Your vault is empty. Save a quote above.</p>
            </div>
          ) : (
            quotes.map((q, i) => {
              const borderColors = ["#FF7E5F", "#00cec9", "#fdcb6e", "#6c5ce7", "#e84393"];
              const color = borderColors[i % borderColors.length];
              return (
                <Card key={i} className="quote-list-item stagger-item" style={{
                  animationDelay: `${0.4 + (i * 0.1)}s`,
                  padding: "24px 28px",
                  borderRadius: "24px",
                  border: "1px solid var(--glass-border)",
                  borderLeft: `4px solid transparent`,
                  background: "var(--card-bg)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
                  cursor: "default",
                  position: "relative"
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderLeftColor = color; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderLeftColor = "transparent"; }}
                >
                  <div style={{ position: "absolute", top: "12px", left: "20px", opacity: 0.15, fontSize: "70px", fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, color: color }}>"</div>
                  <p style={{ margin: 0, fontSize: "18px", color: "var(--text-main)", lineHeight: "1.7", fontWeight: "400", letterSpacing: "0.3px", position: "relative", zIndex: 1, paddingLeft: "32px", fontStyle: "italic" }}>
                    {q}
                  </p>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
