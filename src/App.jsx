import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Home from "./pages/Home";
import EmotionRooms from "./pages/EmotionRooms";
import ChatRoom from "./pages/ChatRoom";
import MoodCheck from "./pages/MoodCheck";
import Journal from "./pages/Journal";
import JournalEntry from "./pages/JournalEntry";
import Motivation from "./pages/Motivation";
import Profile from "./pages/Profile";
import Breathing from "./pages/Breathing";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />

        {/* Shared Protected Routes (Admin can monitor) */}
        <Route path="/rooms" element={<ProtectedRoute role={["user", "admin"]}><EmotionRooms /></ProtectedRoute>} />
        <Route path="/chat" element={<Navigate to="/rooms" replace />} />
        <Route path="/chat/:id" element={<ProtectedRoute role={["user", "admin"]}><ChatRoom /></ProtectedRoute>} />
        <Route path="/motivation" element={<ProtectedRoute role={["user", "admin"]}><Motivation /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute role={["user", "admin"]}><Profile /></ProtectedRoute>} />
        <Route path="/breathing" element={<ProtectedRoute role={["user", "admin"]}><Breathing /></ProtectedRoute>} />

        {/* User Only Routes (Personal spaces) */}
        <Route path="/home" element={<ProtectedRoute role={["user", "admin"]}><Home /></ProtectedRoute>} />
        <Route path="/mood-check" element={<ProtectedRoute role={["user", "admin"]}><MoodCheck /></ProtectedRoute>} />
        <Route path="/journal" element={<ProtectedRoute role={["user", "admin"]}><Journal /></ProtectedRoute>} />
        <Route path="/journal/new" element={<ProtectedRoute role={["user", "admin"]}><JournalEntry /></ProtectedRoute>} />
        <Route path="/journal/:id" element={<ProtectedRoute role={["user", "admin"]}><JournalEntry /></ProtectedRoute>} />

        {/* Admin Only Protected Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
