import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { MoodContext } from "../context/MoodContext";

export default function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useContext(MoodContext);

    const isAdmin = user?.role === "admin";

    const navItems = isAdmin ? [
        { name: "Dashboard", path: "/admin/dashboard", icon: "🛡️" },
        { name: "Rooms", path: "/rooms", icon: "💬" },
        { name: "Motivation", path: "/motivation", icon: "✨" },
        { name: "Profile", path: "/profile", icon: "👤" },
    ] : [
        { name: "Home", path: "/home", icon: "🏠" },
        { name: "Rooms", path: "/rooms", icon: "💬" },
        { name: "Journal", path: "/journal", icon: "📖" },
        { name: "Profile", path: "/profile", icon: "👤" },
    ];

    return (
        <div
            style={{
                position: "absolute", // Change from fixed to absolute to stay inside #root
                bottom: 12,
                left: "50%",
                transform: "translateX(-50%)",
                width: "85%",
                maxWidth: "400px",
                background: "var(--card-bg)",
                backdropFilter: "blur(12px)",
                borderRadius: "20px",
                display: "flex",
                justifyContent: "space-around",
                padding: "12px 6px",
                boxShadow: "var(--shadow-lg)",
                zIndex: 1000,
                border: "1px solid var(--glass-border)",
                transition: "background 0.4s ease, border 0.4s ease"
            }}
        >
            {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                    <button
                        key={item.name}
                        onClick={() => navigate(item.path)}
                        style={{
                            background: "none",
                            border: "none",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "4px",
                            cursor: "pointer",
                            color: isActive ? "var(--primary)" : "var(--text-sub)",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <span style={{ fontSize: "20px", transform: isActive ? "scale(1.1)" : "scale(1)" }}>
                            {item.icon}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: isActive ? "600" : "400" }}>
                            {item.name}
                        </span>
                        {isActive && (
                            <div style={{
                                width: "4px",
                                height: "4px",
                                background: "var(--primary)",
                                borderRadius: "50%",
                                marginTop: "2px"
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
