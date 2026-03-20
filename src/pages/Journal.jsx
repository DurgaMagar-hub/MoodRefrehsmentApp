import { useNavigate } from "react-router-dom";
import { useContext, useState } from "react";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Journal() {
  const navigate = useNavigate();
  const { journalEntries, aura } = useContext(MoodContext);
  const [page, setPage] = useState(0);

  const entriesPerPage = 5; // More entries since cards are compact
  const totalPages = Math.ceil(journalEntries.length / entriesPerPage);
  const currentEntries = journalEntries.slice(page * entriesPerPage, (page + 1) * entriesPerPage);

  return (
    <Layout title="Your Journal">
      {journalEntries.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-sub)", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: "6vh", marginBottom: "2vh" }}>📓</div>
          <p>No entries yet. Start writing today!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "20px" }}>
          {currentEntries.map((entry, index) => (
            <div
              key={entry.id}
              className="stagger-item"
              style={{ animationDelay: `${index * 0.1}s`, cursor: "pointer" }}
              onClick={() => navigate(`/journal/${entry.id}`)}
            >
              <Card style={{
                padding: "20px 24px",
                border: "1px solid var(--glass-border)",
                borderRadius: "28px",
                background: "var(--card-bg)",
                boxShadow: "var(--shadow-md), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
                position: "relative",
                overflow: "hidden"
              }}>
                {/* Mood Watermark */}
                <div style={{
                  position: "absolute",
                  right: "-10px",
                  bottom: "-10px",
                  fontSize: "80px",
                  opacity: 0.05,
                  transform: "rotate(-15deg)",
                  pointerEvents: "none",
                  zIndex: 0
                }}>
                  {entry.mood}
                </div>

                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      {/* Stylized Date Chip */}
                      <div style={{
                        background: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
                        padding: "4px 12px",
                        borderRadius: "12px",
                        color: "white",
                        fontSize: "12px",
                        fontWeight: "900",
                        boxShadow: "0 4px 10px rgba(255, 126, 95, 0.3)"
                      }}>
                        {new Date(entry.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' }).toUpperCase()}
                      </div>

                      <div style={{
                        padding: "4px 10px",
                        borderRadius: "10px",
                        background: "rgba(255,255,255,0.4)",
                        fontSize: "11px",
                        fontWeight: "800",
                        color: "var(--text-main)",
                        border: "1px solid rgba(255,255,255,0.5)"
                      }}>
                        {entry.mood}
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-sub)", fontWeight: "700", opacity: 0.6, letterSpacing: "0.5px" }}>STORY →</div>
                  </div>

                  <h3 style={{ fontSize: "20px", margin: "0 0 6px", color: "var(--text-main)", fontWeight: "800", letterSpacing: "-0.02em" }}>{entry.title}</h3>

                  <p style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "var(--text-sub)",
                    lineHeight: "1.6",
                    opacity: 0.8,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical"
                  }}>
                    {(() => {
                      const div = document.createElement("div");
                      div.innerHTML = entry.content;
                      return div.textContent || div.innerText || "";
                    })()}
                  </p>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Modernized Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "24px",
          padding: "0 8px",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "12px 20px",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            style={{
              background: "none",
              border: "none",
              color: page === 0 ? "rgba(0,0,0,0.2)" : "#FF7E5F",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              opacity: page === 0 ? 0.3 : 1
            }}
          >
            ← PREVIOUS
          </button>
          <span style={{ fontSize: "14px", color: "var(--text-main)", fontWeight: "800" }}>
            {page + 1} <span style={{ opacity: 0.4 }}>OF</span> {totalPages}
          </span>
          <button
            disabled={page === totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            style={{
              background: "none",
              border: "none",
              color: page === totalPages - 1 ? "rgba(0,0,0,0.2)" : "#FF7E5F",
              fontWeight: "800",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              opacity: page === totalPages - 1 ? 0.3 : 1
            }}
          >
            NEXT →
          </button>
        </div>
      )}

      {/* Pill-Shaped Floating Action Button */}
      <div style={{ position: "absolute", bottom: "100px", right: "20px", zIndex: 100 }}>
        <Button
          onClick={() => navigate("/journal/new")}
          style={{
            borderRadius: "30px",
            padding: "0 24px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 10px 25px rgba(255, 126, 95, 0.4)",
            background: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
            border: "none"
          }}
        >
          <span style={{ fontSize: "24px", fontWeight: "300" }}>+</span>
          <span style={{ fontSize: "14px", fontWeight: "700", letterSpacing: "0.5px" }}>NEW REFLECTION</span>
        </Button>
      </div>
    </Layout>
  );
}
