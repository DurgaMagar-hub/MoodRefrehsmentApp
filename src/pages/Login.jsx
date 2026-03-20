import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MoodContext } from "../context/MoodContext";
import { generateIdentity } from "../utils/identity";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

export default function Login() {
  const navigate = useNavigate();
  const { login, accounts, setAccounts } = useContext(MoodContext);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  // Modes: 'login' or 'signup'
  const [mode, setMode] = useState('login');
  // Steps for signup: 'details' -> 'otp' -> 'identity'
  const [signupStep, setSignupStep] = useState('details');

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [identity, setIdentity] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!email || !password) return;

    const existingAccount = accounts.find(a => a.email === email && a.password === password);

    if (existingAccount) {
      login(existingAccount, stayLoggedIn);
      if (existingAccount.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/home");
      }
    } else {
      setError("Invalid email or password");
    }
  };

  const handleSignUpDetails = () => {
    setError("");
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
    setTimeout(() => {
      setIsLoading(false);
      setSignupStep('otp');
    }, 800);
  };

  const handleVerifyOTP = () => {
    if (otp.length < 4) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const newIdentity = generateIdentity();
      setIdentity(newIdentity);
      setSignupStep('identity');
    }, 800);
  };

  const handleFinalJoin = () => {
    const newAccount = {
      email,
      password,
      ...identity,
      role: 'user', // Always user by default for signups
      joinedAt: new Date().toISOString()
    };

    setAccounts([...accounts, newAccount]);
    login(newAccount, stayLoggedIn);
    navigate("/home");
  };

  return (
    <Layout showNav={false}>
      <div style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "20px"
      }}>

        {mode === 'login' ? (
          <div className="animate-fade-in">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#2d3436" }}>Welcome Back</h1>
              <p style={{ color: "#636e72" }}>Sign in to your safe space.</p>
            </div>
            <Card>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, marginTop: "12px" }}
              />

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginTop: "16px",
                padding: "0 4px",
                cursor: "pointer",
                userSelect: "none"
              }} onClick={() => setStayLoggedIn(!stayLoggedIn)}>
                <div style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: "2px solid var(--primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: stayLoggedIn ? "var(--primary)" : "transparent",
                  transition: "all 0.2s ease"
                }}>
                  {stayLoggedIn && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                </div>
                <span style={{ fontSize: "14px", color: "var(--text-sub)" }}>Stay logged in</span>
              </div>

              {error && <p style={{ color: "#e74c3c", fontSize: "14px", marginTop: "12px" }}>{error}</p>}
              <Button fullWidth onClick={handleLogin} style={{ marginTop: "20px" }}>
                Login
              </Button>
              <Button variant="ghost" fullWidth onClick={() => setMode('signup')} style={{ marginTop: "10px", color: "#888" }}>
                No account? Sign Up
              </Button>
            </Card>
          </div>
        ) : (
          /* Sign Up Flow */
          <div className="animate-fade-in">
            {signupStep === 'details' && (
              <>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#2d3436" }}>Join Space</h1>
                  <p style={{ color: "#636e72" }}>Create your account to start your journey.</p>
                </div>
                <Card>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="password"
                    placeholder="Create Password (6+ chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle, marginTop: "12px" }}
                  />

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginTop: "16px",
                    padding: "0 4px",
                    cursor: "pointer",
                    userSelect: "none"
                  }} onClick={() => setStayLoggedIn(!stayLoggedIn)}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "6px",
                      border: "2px solid var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: stayLoggedIn ? "var(--primary)" : "transparent",
                      transition: "all 0.2s ease"
                    }}>
                      {stayLoggedIn && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "14px", color: "var(--text-sub)" }}>Stay logged in</span>
                  </div>

                  {error && <p style={{ color: "#e74c3c", fontSize: "14px", marginTop: "12px" }}>{error}</p>}
                  <Button fullWidth onClick={handleSignUpDetails} disabled={isLoading} style={{ marginTop: "20px" }}>
                    {isLoading ? "Processing..." : "Continue"}
                  </Button>
                  <Button variant="ghost" fullWidth onClick={() => setMode('login')} style={{ marginTop: "10px", color: "#888" }}>
                    Already have an account? Login
                  </Button>
                </Card>
              </>
            )}

            {signupStep === 'otp' && (
              <>
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                  <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#2d3436" }}>Verify Gmail</h1>
                  <p style={{ color: "#636e72" }}>We sent a code to <br /><b>{email}</b></p>
                  <p style={{ fontSize: "12px", color: "#bbb", marginTop: "8px" }}>(OTP only needed for new accounts)</p>
                </div>
                <Card>
                  <input
                    type="text"
                    maxLength="4"
                    placeholder="0000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    style={{ ...inputStyle, textAlign: "center", letterSpacing: "10px", fontSize: "24px" }}
                  />
                  <Button fullWidth onClick={handleVerifyOTP} disabled={isLoading} style={{ marginTop: "20px" }}>
                    {isLoading ? "Verifying..." : "Confirm Code"}
                  </Button>
                  <Button variant="ghost" fullWidth onClick={() => setSignupStep('details')} style={{ marginTop: "10px", color: "#888" }}>
                    Back
                  </Button>
                </Card>
              </>
            )}

            {signupStep === 'identity' && identity && (
              <div style={{ textAlign: "center" }}>
                <div style={{ marginBottom: "32px" }}>
                  <h1 style={{ fontSize: "32px", marginBottom: "12px", color: "#2d3436" }}>Final Step</h1>
                  <p style={{ color: "#636e72" }}>Generate your public safe identity.</p>
                </div>
                <Card style={{ marginBottom: "24px" }}>
                  <div style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    background: identity.color,
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "40px",
                    margin: "0 auto 20px",
                    boxShadow: `0 10px 30px ${identity.color}44`
                  }}>
                    {identity.avatar}
                  </div>
                  <h2 style={{ fontSize: "24px", margin: "0 0 8px" }}>{identity.name}</h2>
                  <Button variant="ghost" onClick={() => setIdentity(generateIdentity())} style={{ color: "var(--primary)" }}>
                    🔄 Different Name
                  </Button>
                </Card>
                <Button fullWidth onClick={handleFinalJoin} size="large">
                  Create Account & Join
                </Button>
              </div>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}

const inputStyle = {
  width: "100%",
  padding: "18px",
  borderRadius: "20px",
  border: "1px solid var(--glass-border)",
  fontSize: "16px",
  background: "var(--card-bg)",
  backdropFilter: "blur(10px)",
  outline: "none",
  boxSizing: "border-box",
  color: "var(--text-main)",
  boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)"
};
