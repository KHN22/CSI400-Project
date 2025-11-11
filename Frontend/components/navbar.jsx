"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthStatus from "./auth-status";
import LogoutButton from "./logout-button";
import "../styles/navbar.css";

export function Navbar() {
  const [user, setUser] = useState(null);
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  // centralized fetch user function
  async function loadUser() {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: "include" });
      if (res.ok) {
        const payload = await res.json();
        // backend might return { user } or user object directly
        const u = payload.user || payload || null;
        setUser(u);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }

  useEffect(() => {
    let bc;
    // initial load
    loadUser();

    // update on custom event
    const onAuthChanged = () => loadUser();
    window.addEventListener("auth-changed", onAuthChanged);

    // storage event (cross-tab)
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === "auth" || e.key === "auth-change") loadUser();
    };
    window.addEventListener("storage", onStorage);

    // BroadcastChannel for modern browsers (cross-tab)
    try {
      bc = new BroadcastChannel("auth");
      bc.onmessage = () => loadUser();
    } catch (err) {
      /* ignore if not supported */
    }

    return () => {
      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
      if (bc) bc.close();
    };
  }, []);

  return (
    <nav className="cb-navbar">
      <div className="cb-navbar-left">
        <Link href="/" className="cb-logo">CineBook</Link>
      </div>

      <div className="cb-navbar-center">
        <Link href="/" className="cb-link">Home</Link>
        <Link href="/bookings" className="cb-link">Bookings</Link>
        <Link href="/profile" className="cb-link">Profile</Link>
        {user?.role === "Admin" && <Link href="/admin" className="cb-link">Admin</Link>}
      </div>

      <div className="cb-navbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <AuthStatus />
        <LogoutButton />
      </div>
    </nav>
  );
}
