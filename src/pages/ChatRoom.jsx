import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import io from "socket.io-client";

export default function ChatRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(MoodContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [activeUsers, setActiveUsers] = useState(1);
  const chatContainerRef = useRef(null);
  const socketRef = useRef(null);

  const CONNECTION_PORT = "http://localhost:3001";

  // Room Colors
  // Room Colors - Enhanced Immersive Gradients
  const roomThemes = {
    sad: { color: "#6c5ce7", gradient: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" },
    anxiety: { color: "#00b894", gradient: "linear-gradient(180deg, #0f2027 0%, #203a43 50%, #2c5364 100%)" },
    motivation: { color: "#e17055", gradient: "linear-gradient(180deg, #1e130c 0%, #9a0606 100%)" },
    lonely: { color: "#0984e3", gradient: "linear-gradient(180deg, #000428 0%, #004e92 100%)" },
    stress: { color: "#d63031", gradient: "linear-gradient(180deg, #200122 0%, #6f0000 100%)" }
  };

  const currentTheme = roomThemes[id] || { color: "var(--primary)", gradient: "var(--bg-gradient)" };
  const themeColor = currentTheme.color;

  useEffect(() => {
    socketRef.current = io(CONNECTION_PORT);
    
    socketRef.current.emit("join_room", id);
    
    socketRef.current.on("receive_message", (data) => {
      setMessages((prev) => [...prev, data]);
    });
    
    socketRef.current.on("room_data", (data) => {
      setActiveUsers(data.users);
    });
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const messageData = {
      room: id,
      sender: user?.name || "Anonymous",
      color: user?.color || themeColor,
      text: input,
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    socketRef.current?.emit("send_message", messageData);
    setMessages((prev) => [...prev, messageData]);
    setInput("");
  };

  return (
    <Layout
      showNav={false}
      disableScroll={true}
      customBackground={currentTheme.gradient}
      title={`${id.charAt(0).toUpperCase() + id.slice(1)} Sanctuary`}
      subtitle={
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#2ecc71",
            boxShadow: "0 0 10px #2ecc71"
          }} />
          <span style={{ color: "#27ae60", fontWeight: "800", fontSize: "12px", letterSpacing: "0.5px" }}>{activeUsers} PRESENT</span>
        </div>
      }
    >
      <style>{`
        .chat-view {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .chat-container {
          flex: 1;
          min-height: 0; 
          overflow-y: auto;
          padding: 24px 12px 110px; /* Large bottom padding to clear the pinned input */
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        
        .message-pop {
            animation: messagePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes messagePop {
            from { transform: scale(0.8) translateY(20px); opacity: 0; }
            to { transform: scale(1) translateY(0); opacity: 1; }
        }

        .breathing-halo {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, ${themeColor}22 0%, transparent 60%);
            filter: blur(80px);
            animation: breatheHalo 15s ease-in-out infinite alternate;
            z-index: 0;
            pointer-events: none;
        }
        @keyframes breatheHalo {
            from { opacity: 0.1; transform: translate(-50%, -50%) scale(0.8); }
            to { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>

      <div className="chat-view">
        <div className="breathing-halo" />

        <div className="chat-container" ref={chatContainerRef}>
          <div style={{ textAlign: "center", margin: "10px 0 30px", position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-block",
              padding: "8px 16px",
              borderRadius: "20px",
              background: "rgba(255,126,95,0.1)",
              border: "1px solid rgba(255,126,95,0.2)",
              fontSize: "10px",
              color: "var(--primary)",
              fontWeight: "900",
              backdropFilter: "blur(4px)",
              textTransform: "uppercase",
              letterSpacing: "1.5px"
            }}>
              ✨ Sanctuary Space ✨
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative", zIndex: 1 }}>
            {messages.map((msg, index) => {
              const isMe = msg.sender === user?.name;
              const prevMsg = messages[index - 1];
              const nextMsg = messages[index + 1];
              const isFromSame = prevMsg?.sender === msg.sender;
              const willBeSame = nextMsg?.sender === msg.sender;

              return (
                <div
                  key={msg.id || index}
                  className="message-pop"
                  style={{
                    alignSelf: isMe ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    marginTop: isFromSame ? "-8px" : "12px"
                  }}
                >
                  {!isMe && !isFromSame && (
                    <span style={{ fontSize: "11px", fontWeight: "900", color: themeColor, marginLeft: "14px", marginBottom: "2px", opacity: 0.8 }}>
                      {msg.sender}
                    </span>
                  )}

                  <div style={{
                    background: isMe
                      ? `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
                      : "rgba(255, 255, 255, 0.15)",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: "20px",
                    borderTopRightRadius: isMe && isFromSame ? "20px" : (isMe ? "4px" : "20px"),
                    borderTopLeftRadius: !isMe && isFromSame ? "20px" : (!isMe ? "4px" : "20px"),
                    borderBottomRightRadius: "20px",
                    borderBottomLeftRadius: "20px",
                    boxShadow: isMe ? `0 8px 25px ${themeColor}22` : "none",
                    fontSize: "15px",
                    fontWeight: "500",
                    lineHeight: "1.4",
                    border: "1px solid rgba(255,255,255,0.1)",
                    backdropFilter: "blur(10px)",
                    position: "relative"
                  }}>
                    {msg.text}
                    <div style={{
                      fontSize: "9px",
                      opacity: 0.5,
                      marginTop: "4px",
                      textAlign: "right",
                      fontWeight: "700"
                    }}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{ height: "10px" }} />
          </div>
        </div>

        {/* Stable Input Area - Pinned strictly to the bottom of the container */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            padding: "16px 20px 24px",
            zIndex: 10,
            background: "linear-gradient(to top, rgba(0,0,0,0.2), transparent)"
          }}
        >
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(30px)",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "6px",
            display: "flex",
            alignItems: "center",
            boxShadow: "0 15px 40px rgba(0,0,0,0.2)"
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="What's on your mind?..."
              style={{
                flex: 1,
                border: "none",
                background: "none",
                outline: "none",
                fontSize: "15px",
                color: "white",
                fontWeight: "500",
                paddingLeft: "16px",
                height: "44px"
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "18px",
                border: "none",
                background: input.trim() ? "white" : "rgba(255,255,255,0.1)",
                color: input.trim() ? themeColor : "rgba(255,255,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: input.trim() ? "pointer" : "default",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow: input.trim() ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
