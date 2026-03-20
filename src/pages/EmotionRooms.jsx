import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import Card from "../components/Card";
import io from "socket.io-client";

let socket;

export default function EmotionRooms() {
  const navigate = useNavigate();
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    socket = io("http://localhost:3001");
    socket.on("global_room_data", (data) => {
      setRoomCounts(data);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const rooms = [
    { id: "sad", name: "Sad Support", icon: "😢", desc: "Share your burden in a safe space.", color: "#6c5ce7" },
    { id: "anxiety", name: "Anxiety Relief", icon: "😰", desc: "Calm your mind with the community.", color: "#00b894" },
    { id: "motivation", name: "Motivation Circle", icon: "🔥", desc: "Get inspired and lift others up.", color: "#e17055" },
    { id: "lonely", name: "Loneliness", icon: "😔", desc: "Find deep connection and warmth.", color: "#0984e3" },
    { id: "stress", name: "Stress Buster", icon: "🤯", desc: "Vent it out and find your peace.", color: "#d63031" },
  ];

  return (
    <Layout title="Support Sanctuaries">
      <style>{`
        .room-card {
            transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
        }
        .room-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 25px 50px rgba(0,0,0,0.1);
        }
        .room-card:active {
            transform: translateY(-2px) scale(0.98);
        }
        .room-card:hover .action-arrow {
            transform: translateX(4px) scale(1.05) !important;
        }

        .online-pulse {
            position: relative;
        }
        .online-pulse::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 50%;
            background: #2ecc71;
            animation: pulse-ring 2s infinite;
        }
        @keyframes pulse-ring {
            0% { transform: scale(0.5); opacity: 0.8; }
            80%, 100% { transform: scale(3.5); opacity: 0; }
        }

        .stagger-room {
            animation: roomPop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
        }
        @keyframes roomPop {
            from { transform: translateY(30px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "24px", paddingBottom: "40px" }}>
        {rooms.map((room, idx) => (
          <div key={room.id} className="stagger-room" style={{ animationDelay: `${idx * 0.12}s` }}>
            <Card
              onClick={() => navigate(`/chat/${room.id}`)}
              className="room-card"
              style={{
                padding: "24px 28px",
                borderRadius: "32px",
                border: "1px solid var(--glass-border)",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {/* Vibrant Icon Container */}
                <div style={{
                  width: "76px",
                  height: "76px",
                  borderRadius: "24px",
                  background: `linear-gradient(135deg, ${room.color}22 0%, ${room.color}05 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "38px",
                  border: `1px solid ${room.color}33`,
                  boxShadow: `inset 0 2px 10px ${room.color}11, 0 8px 16px ${room.color}15`,
                  flexShrink: 0
                }}>
                  <span style={{ filter: `drop-shadow(0 4px 6px ${room.color}44)` }}>{room.icon}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                    <h3 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                      {room.name}
                    </h3>
                    {roomCounts[room.id] > 0 && (
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(46, 204, 113, 0.15)",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        border: "1px solid rgba(46, 204, 113, 0.2)"
                      }}>
                        <div className="online-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#2ecc71", boxShadow: "0 0 8px #2ecc71" }} />
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#27ae60", letterSpacing: "0.5px" }}>{roomCounts[room.id]} ONLINE</span>
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, fontSize: "15px", color: "var(--text-sub)", fontWeight: "500", lineHeight: "1.5" }}>
                    {room.desc}
                  </p>
                </div>

                {/* Sleek Action Arrow */}
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "24px",
                  background: `linear-gradient(135deg, ${room.color} 0%, ${room.color}dd 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: `0 8px 16px ${room.color}44`,
                  flexShrink: 0,
                  transform: "translateX(0)",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
                }} className="action-arrow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" />
                  </svg>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>
    </Layout>
  );
}
