import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";

export default function ProtectedRoute({ children, role }) {
    const { user } = useContext(MoodContext);

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role) {
        const roles = Array.isArray(role) ? role : [role];
        if (!roles.includes(user.role)) {
            // Redirect based on role if unauthorized
            if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
            return <Navigate to="/home" replace />;
        }
    }

    return children;
}
