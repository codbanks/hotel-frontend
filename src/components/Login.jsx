import React, { useState, useRef, useEffect } from "react";
import "../styles/Login.css";
import api from "../api/api"; 

export default function Login({ onAuth }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  
  // Use localStorage to match your api.js interceptor
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("access"));
  
  const cardRef = useRef(null);
  const sparksRef = useRef(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      // The API call to your Render backend
      const res = await api.post("/token/", { username, password });

      // ✅ Changed to localStorage to match your api.js logic
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      if (res.data.user) {
        localStorage.setItem("user_payload", JSON.stringify(res.data.user));
      }

      setLoggedIn(true);
      if(onAuth) onAuth(); 
    } catch (error) {
      console.error("Login failed:", error);
      const msg =
        error.response?.data?.detail ||
        "Invalid username or password.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setLoggedIn(false);
    window.location.reload(); 
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
                  placeholder="Admin username"
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

              <div className="login-foot">
                © {new Date().getFullYear()} Pumpkin Hotel
              </div>
            </form>
          </>
        )}
        <div className="sparks" ref={sparksRef} />
      </div>
    </div>
  );
}