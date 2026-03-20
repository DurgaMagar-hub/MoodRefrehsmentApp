import { useContext, useState } from "react";
import { MoodContext } from "../context/MoodContext";
import { generateIdentity } from "../utils/identity";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import MoodGraph from "../components/MoodGraph";

export default function Profile() {
  const { user, setUser, logout, moodHistory, journalEntries, settings, setSettings, clearAllData, aura } = useContext(MoodContext);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleRegenerate = () => {
    const newIdentity = generateIdentity();
    if (setUser) setUser({ ...user, ...newIdentity });
  };

  const toggleTheme = () => {
    const themes = ["system", "dark", "light"];
    const currentTheme = settings?.theme || "system";
    const nextTheme = themes[(themes.indexOf(currentTheme) + 1) % themes.length];
    setSettings({ ...settings, theme: nextTheme });
  };

  const toggleNotifications = () => {
    setSettings({ ...settings, notifications: !(settings?.notifications ?? true) });
  };

  return (
    <Layout
      title="Profile"
    >
      <div style={{ paddingBottom: "20px" }}>
        {/* Profile Identity Card */}
        <Card style={{
          marginBottom: "24px",
          textAlign: "center",
          padding: "32px 20px",
          background: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(30px)",
          border: "1px solid rgba(255,255,255,0.2)"
        }}>
          <div style={{ position: "relative", width: "120px", height: "120px", margin: "0 auto 20px" }}>
            <svg viewBox="0 0 200 200" style={{
              position: "absolute",
              top: 0, left: 0, width: "100%", height: "100%",
              filter: "blur(15px)",
              opacity: 0.6,
              animation: "morphBlobProfile 10s ease-in-out infinite alternate"
            }}>
              <path fill={aura?.color || "var(--primary)"} d="M44.7,-76.4C58.3,-69.2,70.1,-58.5,78.2,-45.6C86.3,-32.7,90.8,-17.7,89.5,-3C88.2,11.7,81.1,26,71.5,38.1C61.9,50.1,49.8,59.9,36.4,66.8C23,73.7,8.2,77.7,-6.6,76.5C-21.4,75.3,-36.2,68.9,-49.4,59.5C-62.7,50.1,-74.5,37.6,-80.1,23C-85.7,8.4,-85.1,-8.3,-79.9,-23.4C-74.8,-38.5,-65.1,-52.1,-52.1,-59.5C-39.1,-66.9,-22.8,-68.1,-7.2,-74.3C8.4,-80.5,16.8,-91.7,31.2,-91.5C45.6,-91.3,55.1,-79.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
            <div style={{
              fontSize: "64px",
              position: "relative",
              zIndex: 2,
              animation: "auraBreatheProfile 4s ease-in-out infinite"
            }}>
              {user?.avatar || "👤"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
            <h2 style={{ margin: 0, fontSize: "28px", fontWeight: "900" }}>{user?.name || "Seeker"}</h2>
            <button
              onClick={handleRegenerate}
              style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", opacity: 0.6 }}
              title="Change Identity"
            >
              🔄
            </button>
          </div>

          <div style={{
            display: "inline-block",
            fontSize: "12px",
            fontWeight: "800",
            color: "var(--primary)",
            textTransform: "uppercase",
            letterSpacing: "1px",
            background: "rgba(0,0,0,0.05)",
            padding: "4px 12px",
            borderRadius: "20px"
          }}>
            Level {Math.floor((moodHistory?.length || 0) / 5) + 1} • {aura?.name || "Neutral"} Bloom
          </div>
        </Card>

        {/* Analytics Section */}
        <div style={{ marginBottom: "24px" }}>
          <MoodGraph />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }}>
          <Card style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--primary)" }}>{moodHistory?.length || 0}</div>
            <div style={{ fontSize: "11px", fontWeight: "700", opacity: 0.6, textTransform: "uppercase" }}>Check-ins</div>
          </Card>
          <Card style={{ textAlign: "center", padding: "16px" }}>
            <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--accent)" }}>{journalEntries?.length || 0}</div>
            <div style={{ fontSize: "11px", fontWeight: "700", opacity: 0.6, textTransform: "uppercase" }}>Journals</div>
          </Card>
        </div>

        {/* Settings Section */}
        <div id="settings-container">
          <h3 style={{ fontSize: "14px", fontWeight: "800", opacity: 0.5, marginBottom: "16px", textTransform: "uppercase", letterSpacing: "2px", paddingLeft: "8px" }}>
            App Settings
          </h3>

          <Card style={{ padding: "8px", overflow: "visible" }}>
            <SettingItem
              icon="🔔"
              title="Reminders"
              desc="Daily mindfulness pings"
              active={settings?.notifications ?? true}
              onClick={toggleNotifications}
            />
            <div style={{ height: "1px", background: "var(--glass-border)", margin: "0 16px" }} />
            <SettingItem
              icon={settings?.theme === 'dark' ? "🌙" : (settings?.theme === 'light' ? "☀️" : "⚙️")}
              title="Interface"
              desc={settings?.theme === 'dark' ? "Always Dark" : (settings?.theme === 'light' ? "Always Light" : "Follow System")}
              onClick={toggleTheme}
              label="CYCLE"
            />
            <div style={{ height: "1px", background: "var(--glass-border)", margin: "0 16px" }} />
            <SettingItem
              icon="🛡️"
              title="Security"
              desc="Delete all local data"
              onClick={() => setShowClearConfirm(true)}
              label="WIPE"
              danger
            />
          </Card>
        </div>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <button
            onClick={() => { logout?.(); window.location.href = "/"; }}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "16px",
              background: "rgba(255,118,117,0.1)",
              border: "1px solid rgba(255,118,117,0.2)",
              color: "#ff7675",
              fontWeight: "800",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Sign Out
          </button>

          <div style={{ marginTop: "24px", opacity: 0.4, fontSize: "10px", fontWeight: "700", letterSpacing: "1px" }}>
            MOOD REFRESHMENT V1.0 • 2026
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showClearConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px", zIndex: 10000
        }}>
          <Card style={{ maxWidth: "400px", textAlign: "center", padding: "32px" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
            <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Erase everything?</h3>
            <p style={{ opacity: 0.7, fontSize: "14px", marginBottom: "24px" }}>
              This will permanently delete your journals and mood history. This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <Button variant="danger" fullWidth onClick={() => { clearAllData?.(); setShowClearConfirm(false); }}>Erase All</Button>
              <Button variant="ghost" fullWidth onClick={() => setShowClearConfirm(false)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}

      <style>{`
        @keyframes morphBlobProfile {
          0% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; }
          100% { border-radius: 60% 40% 40% 60% / 60% 60% 40% 40%; }
        }
        @keyframes auraBreatheProfile {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </Layout>
  );
}

function SettingItem({ icon, title, desc, active, onClick, label, danger }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "16px",
        cursor: "pointer",
        transition: "background 0.2s ease"
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(0,0,0,0.03)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "none"}
    >
      <div style={{
        width: "40px",
        height: "40px",
        borderRadius: "12px",
        background: "var(--card-bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: "700", fontSize: "15px", color: danger ? "var(--danger)" : "var(--text-main)" }}>{title}</div>
        <div style={{ fontSize: "12px", opacity: 0.5 }}>{desc}</div>
      </div>
      {label && (
        <div style={{
          fontSize: "10px",
          fontWeight: "900",
          padding: "4px 8px",
          borderRadius: "8px",
          background: danger ? "rgba(255,118,117,0.1)" : "var(--primary)",
          color: danger ? "#ff7675" : "var(--bg-dark)"
        }}>
          {label}
        </div>
      )}
      {active !== undefined && (
        <div style={{
          width: "40px",
          height: "24px",
          borderRadius: "12px",
          background: active ? "var(--primary)" : "rgba(0,0,0,0.1)",
          padding: "2px",
          display: "flex",
          alignItems: "center",
          transition: "all 0.3s ease"
        }}>
          <div style={{
            width: "20px",
            height: "200%", // wait, why 200%? typo
            width: "20px",
            height: "20px",
            background: "white",
            borderRadius: "50%",
            transform: active ? "translateX(16px)" : "translateX(0)",
            transition: "all 0.3s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }} />
        </div>
      )}
    </div>
  );
}
