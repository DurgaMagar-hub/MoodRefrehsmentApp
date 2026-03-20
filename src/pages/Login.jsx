import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import { generateIdentity } from "../utils/identity";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function Login() {
  const navigate = useNavigate();
  const { login, accounts, setAccounts, isDarkTheme } = useContext(MoodContext);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'reset'
  const [signupStep, setSignupStep] = useState('details'); // 'details' | 'otp'
  const [resetStep, setResetStep] = useState('email'); // 'email' | 'otp'

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!email && !password) {
      setError("Please enter your details to continue ✨");
      return;
    }
    if (!email) {
      setError("We need your email to find your space 📬");
      return;
    }
    if (!password) {
      setError("Don't forget your password 🔐");
      return;
    }

    const existingAccount = accounts.find(a => a.email === email && a.password === password);

    if (existingAccount) {
      login(existingAccount, stayLoggedIn);
      if (existingAccount.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }
    } else {
      setError("We couldn't find an account with those details 🦋");
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email to find your space 📬");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/forgot-password`, { email });
      setResetStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || "Error sending reset code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    if (!otp || !newPassword) {
      setError("Please enter the code and your new password ✨");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters 🔐");
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, { email, otp, newPassword });
      setMode('login');
      setResetStep('email');
      setPassword(newPassword); // Pre-fill for login
      setError("Password reset successfully! You can now sign in ✨");
    } catch (err) {
      setError(err.response?.data?.error || "Error resetting password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google-custom`, { 
        access_token: tokenResponse.access_token 
      });
      login(res.data, stayLoggedIn);
      if (res.data.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }
    } catch (err) {
      setError("Google Authentication Failed.");
      console.error(err);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google Authentication was cancelled or failed.")
  });

  const handleSignUpDetails = async () => {
    setError("");
    if (!email && !password) {
      setError("Please enter your details to continue ✨");
      return;
    }
    if (!email) {
      setError("We need your email to find your space 📬");
      return;
    }
    if (!password) {
      setError("Don't forget your password 🔐");
      return;
    }

    if (!email.includes("@") || password.length < 6) {
      setError("Please enter a valid email and 6+ char password");
      return;
    }

    const exists = accounts.find(a => a.email === email);
    if (exists) {
      setError("Email already registered");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email });
      setSignupStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || "Error sending OTP email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    try {
      const payload = { email, password, otp };
      const res = await axios.post(`${API_URL}/auth/verify-otp`, payload);
      const newAccount = res.data;
      
      setAccounts([...accounts, newAccount]);
      login(newAccount, stayLoggedIn);
      navigate("/home");
      
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP Code");
    } finally {
      setIsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const inputStyle = {
    width: "100%",
    padding: "20px 24px",
    borderRadius: "20px",
    border: "1px solid var(--glass-border)",
    fontSize: "16px",
    background: isDarkTheme ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)",
    backdropFilter: "blur(20px)",
    outline: "none",
    boxSizing: "border-box",
    color: "var(--text-main)",
    transition: "all 0.3s ease",
    boxShadow: isDarkTheme ? "0 4px 12px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.05)",
    fontWeight: "600"
  };

  const eyeButtonStyle = {
    position: "absolute",
    right: "20px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    fontSize: "18px",
    opacity: 0.8,
    color: isDarkTheme ? "var(--text-sub)" : "#636E72",
    zIndex: 2,
    transition: "all 0.3s"
  };

  return (
    <Layout showNav={false}>
      <div style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "20px",
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "300px",
          height: "300px",
          background: "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          filter: "blur(50px)",
          opacity: 0.4,
          zIndex: 0,
          animation: "auraBreatheAuth 10s ease-in-out infinite"
        }} />

        <div className="flip-portal">
          <div className={`flip-track ${mode === 'signup' ? 'is-flipped' : (mode === 'reset' ? 'reset-active' : '')}`}>
            
            <div className="flip-pane">
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <span style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "4px", color: "var(--primary)", opacity: 0.8, display: "block", marginBottom: "8px" }}>
                  {getGreeting()}
                </span>
                <h1 style={{ fontSize: "clamp(32px, 5vh, 48px)", margin: 0, color: isDarkTheme ? "var(--text-main)" : "#2D3436", fontWeight: "900", letterSpacing: "-0.05em" }}>
                  Welcome Back
                </h1>
                <p style={{ color: isDarkTheme ? "var(--text-sub)" : "#636E72", fontSize: "16px", marginTop: "8px", fontWeight: "400" }}>
                  Step into your safe space.
                </p>
              </div>

              <Card className="super-glass-panel" style={{ padding: "32px", border: "1px solid var(--glass-border)" }}>
                {mode === 'login' ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                      <div style={{ position: "relative" }}>
                        <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "60px" }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px", padding: "0 4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", userSelect: "none" }} onClick={() => setStayLoggedIn(!stayLoggedIn)}>
                        <div style={{ width: "18px", height: "18px", borderRadius: "6px", border: "2px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", background: stayLoggedIn ? "var(--primary)" : "transparent", transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                          {stayLoggedIn && <span style={{ color: "white", fontSize: "10px" }}>✓</span>}
                        </div>
                        <span style={{ fontSize: "13px", color: isDarkTheme ? "var(--text-sub)" : "#636E72", fontWeight: "600" }}>Stay logged in</span>
                      </div>
                      <div onClick={() => { setMode('reset'); setResetStep('email'); setError(""); }} style={{ fontSize: "13px", color: "var(--primary)", fontWeight: "600", cursor: "pointer" }}>
                        Forgot Password?
                      </div>
                    </div>

                    <Button fullWidth onClick={handleLogin} style={{ marginTop: "24px", height: "60px", fontSize: "1.2rem" }}>Sign In</Button>
                    <div style={{ textAlign: "center", marginTop: "24px" }}>
                      <span style={{ color: "var(--text-sub)", fontSize: "14px" }}>New here? </span>
                      <span onClick={() => { setMode('signup'); setSignupStep('details'); setError(""); }} style={{ color: "var(--primary)", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}>Create account</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "24px 0" }}>
                      <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
                      <span style={{ fontSize: "12px", color: "var(--text-sub)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px" }}>Or</span>
                      <div style={{ flex: 1, height: "1px", background: "var(--glass-border)" }} />
                    </div>

                    <Button variant="ghost" fullWidth onClick={() => loginWithGoogle()} style={{ background: isDarkTheme ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)", border: "1px solid var(--glass-border)", height: "56px", color: "var(--text-main)", fontSize: "0.95rem", fontWeight: "700" }}>
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px", marginRight: "12px" }} />
                      Continue with Google
                    </Button>
                  </>
                ) : (
                  <>
                    {resetStep === 'email' ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ textAlign: "center", marginBottom: "10px" }}>
                          <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "24px" }}>Reset Password</h2>
                          <p style={{ color: "var(--text-sub)", fontSize: "14px", marginTop: "8px" }}>Enter your email to receive a code.</p>
                        </div>
                        <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                        <Button fullWidth onClick={handleForgotPassword} isLoading={isLoading}>Send Code</Button>
                        <div onClick={() => setMode('login')} style={{ textAlign: "center", color: "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>Back to Sign In</div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ textAlign: "center", marginBottom: "10px" }}>
                          <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "24px" }}>Enter Code</h2>
                          <p style={{ color: "var(--text-sub)", fontSize: "14px", marginTop: "8px" }}>We sent a code to {email}.</p>
                        </div>
                        <input type="text" placeholder="4-digit code" value={otp} onChange={(e) => setOtp(e.target.value)} style={{ ...inputStyle, textAlign: "center", letterSpacing: "8px", fontSize: "24px" }} maxLength={4} />
                        <div style={{ position: "relative" }}>
                          <input type={showPassword ? "text" : "password"} placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "60px" }} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
                        </div>
                        <Button fullWidth onClick={handleResetPassword} isLoading={isLoading}>Reset Password</Button>
                        <div onClick={() => setResetStep('email')} style={{ textAlign: "center", color: "var(--primary)", fontWeight: "600", cursor: "pointer", fontSize: "14px" }}>Try with another email</div>
                      </div>
                    )}
                  </>
                )}
              </Card>

              {error && (
                <div style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "16px",
                  background: error.includes("successfully") ? "rgba(85, 239, 196, 0.15)" : "rgba(255, 118, 117, 0.15)",
                  color: error.includes("successfully") ? "#00b894" : "#d63031",
                  fontSize: "13px",
                  fontWeight: "700",
                  textAlign: "center",
                  border: `1px solid ${error.includes("successfully") ? "#00b89433" : "#d6303133"}`,
                  animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both"
                }}>
                  {error}
                </div>
              )}
            </div>

            <div className="flip-pane is-signup">
              <div style={{ textAlign: "center", marginBottom: "40px" }}>
                <span style={{ fontSize: "12px", fontWeight: "900", textTransform: "uppercase", letterSpacing: "4px", color: "var(--primary)", opacity: 0.8, display: "block", marginBottom: "8px" }}>Join the Journey</span>
                <h1 style={{ fontSize: "clamp(32px, 5vh, 48px)", margin: 0, color: isDarkTheme ? "var(--text-main)" : "#2D3436", fontWeight: "900", letterSpacing: "-0.05em" }}>Begin Today</h1>
              </div>

              <Card className="super-glass-panel" style={{ padding: "32px", border: "1px solid var(--glass-border)" }}>
                {signupStep === 'details' ? (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                      <div style={{ position: "relative" }}>
                        <input type={showPassword ? "text" : "password"} placeholder="Choose password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ ...inputStyle, paddingRight: "60px" }} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={eyeButtonStyle}>{showPassword ? "👁️‍🗨️" : "👁️"}</button>
                      </div>
                    </div>
                    <Button fullWidth onClick={handleSignUpDetails} isLoading={isLoading} style={{ marginTop: "24px" }}>Create Account</Button>
                  </>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ marginBottom: "24px" }}>
                      <span style={{ fontSize: "40px" }}>📬</span>
                      <h2 style={{ margin: "12px 0 8px", color: "var(--text-main)" }}>Verify Email</h2>
                      <p style={{ color: "var(--text-sub)", fontSize: "14px" }}>We've sent a code to {email}</p>
                    </div>
                    <input type="text" placeholder="----" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} style={{ ...inputStyle, textAlign: "center", letterSpacing: "12px", fontSize: "32px", marginBottom: "24px" }} />
                    <Button fullWidth onClick={handleVerifyOTP} isLoading={isLoading}>Verify & Join</Button>
                    <button onClick={() => setSignupStep('details')} style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: "700", marginTop: "20px", cursor: "pointer", fontSize: "14px" }}>Edit Details</button>
                  </div>
                )}

                <div style={{ textAlign: "center", marginTop: "24px" }}>
                  <span style={{ color: "var(--text-sub)", fontSize: "14px" }}>Already a member? </span>
                  <span onClick={() => { setMode('login'); setError(""); }} style={{ color: "var(--primary)", fontWeight: "800", cursor: "pointer", fontSize: "14px" }}>Sign in</span>
                </div>
              </Card>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        .flip-portal {
          perspective: 2000px;
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .flip-track {
          position: relative;
          width: 100%;
          transition: transform 1s cubic-bezier(0.16, 1, 0.3, 1);
          transform-style: preserve-3d;
        }
        .flip-track.is-flipped {
          transform: rotateY(180deg);
        }
        /* Reset doesn't flip, it just changes content in the front pane for now */
        .flip-pane {
          position: relative;
          width: 100%;
          backface-visibility: hidden;
        }
        .flip-pane.is-signup {
          position: absolute;
          top: 0;
          left: 0;
          transform: rotateY(180deg);
        }
        .super-glass-panel {
          background: ${isDarkTheme ? "rgba(30, 30, 30, 0.45)" : "rgba(255, 255, 255, 0.55)"} !important;
          backdrop-filter: blur(40px) saturate(180%) !important;
          border-radius: 32px !important;
          box-shadow: ${isDarkTheme ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "0 20px 40px -10px rgba(0, 0, 0, 0.1)"} !important;
        }
        @keyframes auraBreatheAuth {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.5; }
        }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </Layout>
  );
}
