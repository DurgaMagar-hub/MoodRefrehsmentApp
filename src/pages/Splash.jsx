import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import { useContext } from "react";

export default function Splash() {
  const navigate = useNavigate();

  const { user } = useContext(MoodContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        if (user.role === "admin") {
          navigate("/admin/dashboard");
        } else {
          navigate("/home");
        }
      } else {
        navigate("/login");
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div
      className="animate-fade-in"
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "20px"
      }}
    >
      <div style={{
        fontSize: "80px",
        marginBottom: "20px",
        filter: "drop-shadow(0 10px 20px rgba(106, 141, 255, 0.4))",
        animation: "float 3s ease-in-out infinite"
      }}>
        🌙
      </div>
      <h1 style={{
        fontSize: "36px",
        margin: "0 0 10px",
        background: "linear-gradient(45deg, var(--primary-dark), var(--accent))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Mood Refreshment
      </h1>
      <p style={{ fontSize: "16px", color: "var(--text-sub)" }}>
        Your safe space to feel better.
      </p>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </div>
  );
}
