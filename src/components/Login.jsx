import React, { useState, useRef, useEffect } from "react";
import "../styles/Login.css";
import api from "../api/api"; // Import the new api instance

export default function Login({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  // We check session storage for initial state
  const [loggedIn, setLoggedIn] = useState(!!sessionStorage.getItem("access"));
  
  const cardRef = useRef(null);
  const sparksRef = useRef(null);

  // 🔹 Spark effect (Unchanged)
  useEffect(() => {
    const container = sparksRef.current;
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("div");
      el.className = "spark";
      el.style.left = `${10 + Math.random() * 80}%`;
      el.style.top = `${40 + Math.random() * 40}%`;
      el.style.animationDelay = `${Math.random() * 4}s`;
      el.style.opacity = `${0.06 + Math.random() * 0.22}`;
      container.appendChild(el);
    }
  }, []);

  // 🔹 3D Tilt effect (Unchanged)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      el.style.transform = `rotateX(${(0.5 - y) * 10}deg) rotateY(${(x - 0.5) * 12}deg) translateZ(12px)`;
    };
    const handleLeave = () => {
      el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  // 🔹 Login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // Use our new API instance (path is relative to baseURL in api.js)
      const res = await api.post("/token/", { username, password });

      // ✅ Use sessionStorage so it clears on browser close
      sessionStorage.setItem("access", res.data.access);
      sessionStorage.setItem("refresh", res.data.refresh);

      if (res.data.user) {
        sessionStorage.setItem("user_payload", JSON.stringify(res.data.user));
      }

      setLoggedIn(true);
      if(onAuth) onAuth(); 
    } catch (error) {
      console.error("Login failed:", error);
      const msg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "Invalid username or password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Logout handler
  const handleLogout = () => {
    sessionStorage.clear();
    setLoggedIn(false);
    window.location.reload(); // Force reload to reset app state
  };

  return (
    <div className={`login-container ${loggedIn ? "logged-in" : ""}`}>
      <div className="bg-layer" aria-hidden="true">
        <div className="bg-fog" style={{ opacity: 0.06 }} />
        {!loggedIn && (
          <>
            <div className="pumpkin p1" aria-hidden="true" />
            <div className="pumpkin p2" aria-hidden="true" />
            <div className="pumpkin p3" aria-hidden="true" />
          </>
        )}
      </div>

      <div className="login-card" ref={cardRef} tabIndex={-1}>
        {loggedIn ? (
          <div className="logged-in-msg">
            <h2>Welcome back!</h2>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <>
            <div className="login-brand">
              <div className="logo">PH</div>
              <div>
                <h2>Pumpkin Hotel Management</h2>
                <div className="login-sub">Executive dashboard — premium access</div>
              </div>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-row">
                <div style={{ flex: 1 }} />
                <div style={{ color: "var(--muted)", fontSize: 12 }}>
                  Forgot password?{" "}
                  <a href="#" style={{ color: "var(--gold)" }}>
                    Reset
                  </a>
                </div>
              </div>

              <div className="actions">
                <button className="login-btn" type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Sign in"}
                </button>
              </div>

              {err && (
                <div style={{ marginTop: 12, color: "#ffb2b2", fontWeight: 700 }}>
                  {err}
                </div>
              )}

              <div className="alt-actions">
                <span>Or continue with</span>
                <a href="#" onClick={(e) => e.preventDefault()}>
                  {" "}
                  SSO{" "}
                </a>
              </div>

              <div className="login-foot">
                © {new Date().getFullYear()} Pumpkin Hotel • Built with care
              </div>
            </form>
          </>
        )}
        <div className="sparks" ref={sparksRef} />
      </div>
    </div>
  );
}