"use client";
import React, { useEffect, useState } from "react";

export default function AuthStatus() {
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    setLoading(true);
    try {
      // try common endpoints (adjust if your backend uses another path)
      const endpoints = [`${BACKEND_BASE}/api/auth/me`, `${BACKEND_BASE}/api/auth/profile`, `${BACKEND_BASE}/api/users/me`];
      let data = null;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, { credentials: "include" });
          if (!res.ok) continue;
          data = await res.json();
          break;
        } catch (e) { continue; }
      }
      // backend might return { user } or user object directly
      const u = data?.user || data?.profile || data || null;
      setUser(u);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();

    // respond to custom event from login/logout flows
    const onAuth = () => fetchUser();
    window.addEventListener("auth-changed", onAuth);

    // storage event for cross-tab (some flows set a localStorage key)
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === "auth" || e.key === "auth-change") fetchUser();
    };
    window.addEventListener("storage", onStorage);

    // BroadcastChannel for modern cross-tab messaging
    let bc;
    try {
      bc = new BroadcastChannel("auth");
      bc.onmessage = () => fetchUser();
    } catch (e) { /* not supported */ }

    return () => {
      window.removeEventListener("auth-changed", onAuth);
      window.removeEventListener("storage", onStorage);
      if (bc) bc.close();
    };
  }, []);

  // Render: adapt to your existing markup structure
  if (loading) return <div className="auth-status">…</div>;
  if (!user) return <div className="auth-status"><a href="/login">Sign in</a></div>;

  return (
    <div className="auth-status">
      <span>{user.email || user.username}</span>
      {/* keep any existing UI (avatar, menu) here */}
    </div>
  );
}