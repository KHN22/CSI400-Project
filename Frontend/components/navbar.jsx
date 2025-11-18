"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import AuthStatus from "./auth-status";
import LogoutButton from "./logout-button";
import "../styles/navbar.css";
import { BACKEND_BASE } from "../lib/api";

export function Navbar() {
  const [user, setUser] = useState(null);

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

  const canViewAdmin = ["SuperAdmin", "Manager"].includes(user?.role);
  const adminTitle = user ? `Admin (${user.role}${user.branch ? ' — ' + user.branch : ''})` : "Admin";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handleDoc);
    return () => document.removeEventListener("pointerdown", handleDoc);
  }, [menuOpen]);

  return (
    <nav className="cb-navbar">
      <div className="cb-navbar-left">
        <Link href="/" className="cb-logo">🎬 CineBook</Link>
      </div>

      <div className="cb-navbar-center">
        <Link href="/" className="cb-link">Home</Link>
        <Link href="/bookings" className="cb-link">Bookings</Link>
        <Link href="/profile" className="cb-link">Profile</Link>
        {canViewAdmin && (
          <Link href="/admin" className="cb-link" title={adminTitle}>
            Admin
          </Link>
        )}
      </div>

      <div className="cb-navbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              className="btn-link"
              onClick={() => setMenuOpen((s) => !s)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <span style={{ fontWeight: 600 }}>{user.email?.split("@")[0] || user.username || user.email}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{user.role}{user.branch ? ` • ${user.branch}` : ""}</span>
            </button>

            {menuOpen && (
              <div className="cb-menu" role="menu" style={{ position: "absolute", right: 0, marginTop: 8, background: "white", border: "1px solid #e6e6e6", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.08)", padding: 8, minWidth: 180 }}>
                <Link href="/profile" className="cb-menu-item" role="menuitem">Profile</Link>
                <Link href="/bookings" className="cb-menu-item" role="menuitem">My Bookings</Link>
                {canViewAdmin ? (
                  <Link href="/admin" className="cb-menu-item" role="menuitem" title={adminTitle}>Admin</Link>
                ) : (
                  <div className="cb-menu-item disabled" role="menuitem" title={user.role ? "You do not have Admin access" : "Sign in to access Admin"} style={{ opacity: 0.6, cursor: "default" }}>Admin</div>
                )}
                <div style={{ marginTop: 6 }}>
                  <LogoutButton />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link href="/login" className="btn-primary">Sign in</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
