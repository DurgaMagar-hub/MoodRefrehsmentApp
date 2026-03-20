import { useState, useContext, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import Layout from "../components/Layout";
import Button from "../components/Button";
import ReactQuill from "react-quill-new";
import "quill/dist/quill.snow.css";

export default function JournalEntry() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addJournalEntry, updateJournalEntry, journalEntries } = useContext(MoodContext);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [mood, setMood] = useState("😐");

  useEffect(() => {
    if (id) {
      const existingEntry = journalEntries.find(e => e.id === Number(id));
      if (existingEntry) {
        setTitle(existingEntry.title);
        setContent(existingEntry.content);
        setMood(existingEntry.mood || "✨");
      }
    }
  }, [id, journalEntries]);

  const moods = ["✨", "🌈", "☀️", "☁️", "🌧️", "🌙"]; // More aesthetic mood set

  const handleSave = () => {
    if (!title.trim()) return;
    setShowConfirm(true);
  };

  const confirmSave = () => {
    if (id) {
      updateJournalEntry(id, {
        title,
        content: content || "<p></p>",
        mood: mood
      });
    } else {
      addJournalEntry({
        title,
        content: content || "<p></p>",
        mood: mood
      });
    }
    setShowConfirm(false);
    navigate("/journal");
  };

  const cancelSave = () => {
    setShowConfirm(false);
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  const formats = [
    'font', 'size',
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align'
  ];

  return (
    <Layout
      showNav={false}
      title={id ? "Refine Thought" : "New Reflection"}
      headerRight={
        <div style={{ position: "relative" }}>
          <Button
            variant="primary"
            size="small"
            disabled={!title}
            onClick={handleSave}
            style={{
              borderRadius: "14px",
              boxShadow: title.length > 20 ? "0 0 15px var(--primary-glow)" : "none",
              transition: "all 0.5s ease"
            }}
          >
            {id ? "Preserve" : "Save"}
          </Button>
          {title.length > 20 && (
            <div style={{
              position: "absolute",
              top: -4, right: -4, width: 8, height: 8,
              background: "var(--accent)",
              borderRadius: "50%",
              animation: "pulse-accent 2s infinite"
            }} />
          )}
        </div>
      }
    >
      <style>{`
        @keyframes pulse-accent {
            0% { transform: scale(1); box-shadow: 0 0 0 0 var(--accent); }
            70% { transform: scale(1.5); box-shadow: 0 0 0 6px rgba(254, 180, 123, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(254, 180, 123, 0); }
        }
        .mood-pill {
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
            filter: grayscale(1);
            opacity: 0.5;
        }
        .mood-pill.active {
            filter: grayscale(0);
            opacity: 1;
            transform: scale(1.2);
            background: rgba(255, 255, 255, 0.3);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, minHeight: 0, marginTop: "20px", paddingBottom: "20px" }}>

        {/* Document-Centric Title */}
        <div className="stagger-item" style={{ animationDelay: "0.1s" }}>
          <input
            placeholder="Untitled Reflection"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              background: "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(20px)",
              padding: "16px 24px",
              borderRadius: "24px",
              fontSize: "28px",
              fontWeight: "900",
              fontFamily: "Outfit, sans-serif",
              outline: "none",
              width: "calc(100% - 16px)",
              margin: "0 8px",
              color: "var(--text-main)",
              letterSpacing: "-0.04em",
              boxShadow: "var(--shadow-sm), inset 0 1px 1px rgba(255,255,255,0.8)",
              transition: "all 0.3s ease",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div className="stagger-item" style={{
          animationDelay: "0.15s",
          display: "flex",
          gap: "12px",
          marginBottom: "12px",
          background: "rgba(255,255,255,0.45)",
          width: "fit-content",
          alignSelf: "center",
          padding: "10px 20px",
          borderRadius: "30px",
          boxShadow: "var(--shadow-sm), inset 0 1px 2px rgba(255,255,255,0.5)",
          border: "1px solid var(--glass-border)"
        }}>
          {moods.map(m => (
            <div
              key={m}
              className={`mood-pill ${mood === m ? 'active' : ''}`}
              onClick={() => setMood(m)}
              style={{
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Editor Container */}
        <div className="stagger-item" style={{ animationDelay: "0.2s", flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            formats={formats}
            placeholder="Start writing..."
            style={{ height: "100%", display: "flex", flexDirection: "column" }}
            className="quill-editor-custom"
          />

          <style>{`
                .quill-editor-custom {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                    height: 100%;
                    border-radius: 32px;
                    background: rgba(255, 255, 255, 0.55); /* Increased for much better contrast */
                    backdrop-filter: blur(30px);
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.8);
                    transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .quill-editor-custom:focus-within {
                    background: rgba(255, 255, 255, 0.7);
                    box-shadow: 0 15px 50px rgba(255, 126, 95, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.5);
                    border-color: rgba(255, 255, 255, 0.9);
                }
                .quill-editor-custom .ql-toolbar {
                    border: none;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
                    background: linear-gradient(to right, rgba(255, 183, 178, 0.2), rgba(178, 206, 254, 0.2));
                    padding: 16px 20px;
                }
                .quill-editor-custom .ql-container {
                    flex: 1;
                    border: none;
                    background: transparent;
                    font-family: 'Poppins', sans-serif;
                    font-size: 17px;
                    line-height: 1.8;
                    color: var(--text-main);
                    overflow-y: auto;
                    border-radius: 0 0 32px 32px;
                }
                /* Formatting the typed text to look gorgeous */
                .quill-editor-custom .ql-editor {
                    padding: 30px 24px; /* Better for mobile */
                    min-height: 100%;
                }
                .quill-editor-custom .ql-editor p {
                    color: #2c3e50; /* Solid dark text for maximum visibility */
                    font-weight: 500;
                    letter-spacing: 0.1px;
                }
                .quill-editor-custom .ql-editor h1, 
                .quill-editor-custom .ql-editor h2, 
                .quill-editor-custom .ql-editor h3 {
                    color: #1a1a1a;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                }
                /* Refined placeholder */
                .quill-editor-custom .ql-editor.ql-blank::before {
                    color: rgba(0, 0, 0, 0.45) !important;
                    font-style: italic;
                    left: 24px;
                    font-weight: 400;
                    font-size: 17px;
                }
                
                /* Custom scrollbar */
                .quill-editor-custom .ql-container::-webkit-scrollbar {
                    width: 6px;
                }
                .quill-editor-custom .ql-container::-webkit-scrollbar-track {
                    background: transparent;
                }
                .quill-editor-custom .ql-container::-webkit-scrollbar-thumb {
                    background-color: var(--primary);
                    border-radius: 8px;
                }
                
                /* Toolbar Icons - POP and Visibility */
                .ql-snow.ql-toolbar button, .ql-snow .ql-toolbar button {
                    opacity: 0.8;
                }
                .ql-snow.ql-toolbar button:hover, .ql-snow .ql-toolbar button:hover,
                .ql-snow.ql-toolbar button:focus, .ql-snow .ql-toolbar button:focus,
                .ql-snow.ql-toolbar button.ql-active, .ql-snow .ql-toolbar button.ql-active,
                .ql-snow.ql-toolbar .ql-picker-label:hover, .ql-snow .ql-toolbar .ql-picker-label:hover,
                .ql-snow.ql-toolbar .ql-picker-label.ql-active, .ql-snow .ql-toolbar .ql-picker-label.ql-active,
                .ql-snow.ql-toolbar .ql-picker-item:hover, .ql-snow .ql-toolbar .ql-picker-item:hover,
                .ql-snow.ql-toolbar .ql-picker-item.ql-selected, .ql-snow .ql-toolbar .ql-picker-item.ql-selected {
                    color: #FF7E5F !important; /* Coral pink pop */
                    opacity: 1;
                    transform: scale(1.1);
                }
                .ql-snow.ql-toolbar button .ql-stroke, .ql-snow .ql-toolbar button .ql-stroke {
                    stroke: #4b5563 !important; /* Darker stroke for visibility */
                    stroke-width: 2;
                }
                .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow .ql-toolbar button:hover .ql-stroke,
                .ql-snow.ql-toolbar button:focus .ql-stroke, .ql-snow .ql-toolbar button:focus .ql-stroke,
                .ql-snow.ql-toolbar button.ql-active .ql-stroke, .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                    stroke: #FF7E5F !important;
                }
                .ql-snow .ql-stroke { stroke: #4b5563 !important; stroke-width: 2; }
                .ql-snow .ql-fill { fill: #4b5563 !important; }
                .ql-snow .ql-picker { color: #4b5563 !important; font-weight: 800; }
                
                /* Hide the 90s labels */
                .ql-picker-label::before {
                    display: none !important;
                }
                .ql-picker-label {
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    padding-right: 18px !important;
                }
                .ql-snow .ql-picker.ql-header .ql-picker-label::after {
                    content: 'H';
                    position: absolute;
                    left: 8px;
                    font-size: 14px;
                }
                
                /* Style the dropdown menu */
                .ql-snow .ql-picker-options {
                    background: rgba(255, 255, 255, 0.8) !important;
                    backdrop-filter: blur(20px);
                    border: 1px solid var(--glass-border) !important;
                    border-radius: 12px !important;
                    box-shadow: var(--shadow-lg) !important;
                    padding: 8px !important;
                }
                .ql-snow .ql-picker-item {
                    color: var(--text-main) !important;
                    padding: 4px 8px !important;
                    border-radius: 6px !important;
                }
                .ql-toolbar.ql-snow { border-radius: 28px 28px 0 0; }
            `}</style>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "24px"
        }}>
          <div style={{
            background: "var(--card-bg)",
            backdropFilter: "blur(20px)",
            borderRadius: "28px",
            padding: "32px",
            textAlign: "center",
            width: "100%",
            maxWidth: "340px",
            boxShadow: "var(--shadow-lg)",
            border: "1px solid var(--glass-border)",
            animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>✨</div>
            <h3 style={{ margin: "0 0 12px", fontSize: "20px", color: "var(--text-main)" }}>Ready to preserve these thoughts?</h3>
            <p style={{ margin: "0 0 28px", fontSize: "15px", color: "var(--text-sub)", lineHeight: "1.5" }}>
              Saving this entry will add it to your personal journal collection.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Button fullWidth onClick={confirmSave}>Yes, Preserve it</Button>
              <Button fullWidth variant="ghost" onClick={cancelSave} style={{ color: "#888" }}>Wait, Not yet</Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
