import { useNavigate, useLocation } from "react-router-dom";
import { useContext } from "react";
import { MoodContext } from "../context/MoodContext";
import BottomNav from "./BottomNav";

export default function Layout({ children, showNav = true, title, subtitle, showBackButton, headerRight, customBackground, disableScroll }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { aura, isDarkTheme } = useContext(MoodContext);

    // Hide back button on Home and Splash by default
    const isRootPage = ["/", "/home", "/login"].includes(location.pathname);
    const displayBack = showBackButton !== undefined ? showBackButton : !isRootPage;

    // Use page-specific disableScroll or default based on location
    const finalDisableScroll = disableScroll !== undefined ? disableScroll : ["/", "/home", "/login", "/splash"].includes(location.pathname);

    // Override aura background with strict dark theme or custom immersive gradient
    const currentBackground = customBackground || (isDarkTheme ? "var(--bg-gradient)" : (aura?.gradient || "var(--bg-gradient)"));

    return (
        <div className="animate-fade-in" style={{
            height: "100%", // Strict viewport height
            display: "flex",
            flexDirection: "column",
            background: currentBackground,
            transition: "background 1.5s ease",
            overflow: "hidden" // Let children handle internal scroll
        }}>
            {(title || displayBack || headerRight) && (
                <div style={{
                    padding: "var(--page-padding)",
                    paddingBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    background: isDarkTheme ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)",
                    backdropFilter: "blur(25px) saturate(180%)",
                    borderBottom: "1px solid var(--glass-border)",
                    zIndex: 1100,
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.03)",
                    flexShrink: 0 // Never shrink the header
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                        {displayBack && (
                            <button
                                onClick={() => navigate(-1)}
                                style={{
                                    background: "rgba(255, 255, 255, 0.45)",
                                    border: "1px solid rgba(255, 255, 255, 0.5)",
                                    borderRadius: "20px",
                                    width: "44px",
                                    height: "44px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    boxShadow: "0 10px 20px rgba(0,0,0,0.06), inset 0 1px 1px white",
                                    color: "var(--text-main)",
                                    transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                    backdropFilter: "blur(10px)",
                                    flexShrink: 0
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = "translateX(-4px) scale(1.05)";
                                    e.currentTarget.style.background = "white";
                                    e.currentTarget.style.boxShadow = "0 15px 30px rgba(0,0,0,0.1)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = "translateX(0) scale(1)";
                                    e.currentTarget.style.background = "rgba(255, 255, 255, 0.45)";
                                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.06), inset 0 1px 1px white";
                                }}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        )}
                        <div>
                            {title && (
                                <h1 style={{ fontSize: "24px", margin: 0, color: "var(--text-main)", fontWeight: "800", textTransform: "capitalize", letterSpacing: "-0.02em" }}>
                                    {title}
                                </h1>
                            )}
                            {subtitle && (
                                <div style={{ fontSize: "14px", color: "var(--text-sub)", marginTop: "4px", fontWeight: "300" }}>
                                    {subtitle}
                                </div>
                            )}
                        </div>
                    </div>
                    {headerRight && (
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            {headerRight}
                        </div>
                    )}
                </div>
            )}
            <div style={{
                flex: 1,
                padding: "0 var(--page-padding)",
                paddingBottom: finalDisableScroll ? "0" : (showNav ? "100px" : "40px"),
                maxWidth: "800px",
                margin: "0 auto",
                width: "100%",
                overflowX: "hidden",
                overflowY: finalDisableScroll ? "hidden" : "auto",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                boxSizing: "border-box",
                minHeight: 0 // Allow container to shrink and scroll
            }}>
                {children}
            </div>
            {showNav && <BottomNav />}
        </div>
    );
}
