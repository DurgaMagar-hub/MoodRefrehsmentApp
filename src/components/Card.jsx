export default function Card({ children, className = "", onClick, style = {} }) {
    const baseStyle = {
        background: "var(--card-bg)",
        backdropFilter: "blur(20px) saturate(160%)",
        WebkitBackdropFilter: "blur(20px) saturate(160%)",
        border: "1px solid var(--glass-border)",
        borderRadius: "24px",
        padding: "24px",
        boxShadow: "var(--shadow-md)",
        transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",
        color: "var(--text-main)",
        ...style
    };

    return (
        <div
            className={`glass-card ${className}`}
            style={baseStyle}
            onClick={onClick}
            onMouseEnter={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = "translateY(-10px) scale(1.01)";
                    e.currentTarget.style.boxShadow = "var(--shadow-lg)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.8)";
                }
            }}
            onMouseLeave={(e) => {
                if (onClick) {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "var(--shadow-md)";
                    e.currentTarget.style.borderColor = "var(--glass-border)";
                }
            }}
        >
            {/* Glossy Reflection Effect */}
            <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "50%",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.4), transparent)",
                pointerEvents: "none"
            }} />
            <div style={{ position: "relative", zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}
