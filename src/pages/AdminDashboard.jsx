import * as React from "react";
import { useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { accounts, logout, deleteAccount, toggleAccountRole } = React.useContext(MoodContext);
    const [page, setPage] = React.useState(0);

    const usersPerPage = 2; // Keep it very small to guarantee it fits 100vh
    const totalPages = Math.ceil(accounts.length / usersPerPage);
    const currentAccounts = accounts.slice(page * usersPerPage, (page + 1) * usersPerPage);

    const stats = [
        { label: "Total Users", value: accounts.length, icon: "👥" },
    ];

    const handleDelete = (email) => {
        if (window.confirm(`Are you sure you want to delete account: ${email}?`)) {
            // Keep paginated index safe
            if (currentAccounts.length === 1 && page > 0) setPage(p => p - 1);
            deleteAccount(email);
        }
    };

    return (
        <Layout
            title="Admin Side"
            subtitle="Full System Control"
            headerRight={
                <Button variant="ghost" onClick={logout} style={{ color: "var(--primary)" }}>
                    Logout
                </Button>
            }
        >
            <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>

                {/* Stats */}
                <div style={{ flex: "0 0 auto", marginBottom: "2vh" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5vh" }}>
                        {stats.map((stat, idx) => (
                            <Card key={idx} style={{ textAlign: "center", padding: "1.5vh" }}>
                                <div style={{ fontSize: "3.5vh", marginBottom: "0.5vh" }}>{stat.icon}</div>
                                <div style={{ fontSize: "2.5vh", fontWeight: "800", color: "var(--text-main)" }}>{stat.value}</div>
                                <div style={{ fontSize: "1.2vh", color: "var(--text-sub)" }}>{stat.label}</div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Controls */}
                <div style={{ flex: "0 0 auto", marginBottom: "2vh" }}>
                    <h2 style={{ fontSize: "2vh", marginBottom: "1vh", color: "var(--text-main)" }}>Monitoring Controls</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5vh" }}>
                        <Card style={{ padding: "1.5vh", cursor: "pointer" }} onClick={() => navigate("/rooms")}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1vh" }}>
                                <div style={{ fontSize: "3vh" }}>💬</div>
                                <div>
                                    <div style={{ fontWeight: "700", fontSize: "clamp(12px, 1.4vh, 16px)" }}>Emotion Rooms</div>
                                    <div style={{ fontSize: "clamp(10px, 1vh, 12px)", color: "var(--text-sub)" }}>Track active chats</div>
                                </div>
                            </div>
                        </Card>
                        <Card style={{ padding: "1.5vh", cursor: "pointer" }} onClick={() => navigate("/motivation")}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1vh" }}>
                                <div style={{ fontSize: "3vh" }}>✨</div>
                                <div>
                                    <div style={{ fontWeight: "700", fontSize: "clamp(12px, 1.4vh, 16px)" }}>Motivation</div>
                                    <div style={{ fontSize: "clamp(10px, 1vh, 12px)", color: "var(--text-sub)" }}>View content pages</div>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* User Management */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                    <h2 style={{ fontSize: "2vh", marginBottom: "1vh", color: "var(--text-main)" }}>User Management</h2>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1vh", minHeight: 0 }}>
                        {currentAccounts.map((account, idx) => (
                            <Card key={idx} style={{ display: "flex", alignItems: "center", gap: "1.5vh", padding: "1.5vh", flex: 1 }}>
                                <div style={{
                                    width: "5vh",
                                    height: "5vh",
                                    borderRadius: "50%",
                                    background: account.color || "#ccc",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "2.5vh"
                                }}>
                                    {account.avatar || "👤"}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: "600", fontSize: "clamp(12px, 1.6vh, 18px)", color: "var(--text-main)" }}>{account.name || "Anonymous"}</div>
                                    <div style={{ fontSize: "clamp(10px, 1.2vh, 14px)", color: "var(--text-sub)" }}>{account.email}</div>
                                </div>

                                <div style={{ display: "flex", gap: "1vh", alignItems: "center" }}>
                                    <button
                                        onClick={() => toggleAccountRole(account.email)}
                                        disabled={account.email === "admin@mood.com"}
                                        style={{
                                            fontSize: "clamp(9px, 1vh, 12px)",
                                            padding: "0.5vh 1vh",
                                            borderRadius: "10px",
                                            background: account.role === 'admin' ? "var(--primary)" : "rgba(0,0,0,0.05)",
                                            color: account.role === 'admin' ? "white" : "var(--text-sub)",
                                            textTransform: "uppercase",
                                            fontWeight: "bold",
                                            border: "none",
                                            cursor: account.email === "admin@mood.com" ? "default" : "pointer"
                                        }}
                                    >
                                        {account.role || 'user'}
                                    </button>

                                    {account.email !== "admin@mood.com" && (
                                        <button
                                            onClick={() => handleDelete(account.email)}
                                            style={{
                                                background: "#ff767522",
                                                color: "#ff7675",
                                                border: "none",
                                                padding: "0.5vh 1vh",
                                                borderRadius: "10px",
                                                fontSize: "clamp(10px, 1.2vh, 14px)",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1.5vh", padding: "0 1vh" }}>
                        <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "600", fontSize: "1.5vh", cursor: page === 0 ? "not-allowed" : "pointer", opacity: page === 0 ? 0.4 : 1 }}>← Prev</button>
                        <span style={{ fontSize: "1.5vh", color: "var(--text-sub)", fontWeight: "600" }}>{page + 1} / {totalPages}</span>
                        <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "600", fontSize: "1.5vh", cursor: page === totalPages - 1 ? "not-allowed" : "pointer", opacity: page === totalPages - 1 ? 0.4 : 1 }}>Next →</button>
                    </div>
                )}
            </div>
        </Layout>
    );
}
