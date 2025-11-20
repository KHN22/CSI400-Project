"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import AuthStatus from "./auth-status";
import LogoutButton from "./logout-button";
import "../styles/navbar.css";
import { BACKEND_BASE } from "../lib/api";
import { toast } from '@/hooks/use-toast'

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
  const canViewFunction = ["SuperAdmin", "Manager", "Staff"].includes(user?.role);
  function formatBranch(b) {
    if (!b) return '';
    const s = String(b).trim();
    if (!s) return '';
    if (/^branch/i.test(s)) return s;
    const up = s.toUpperCase();
    if (/^[ABC]$/.test(up)) return `Branch ${up}`;
    return s;
  }

  const adminTitle = user ? `Admin (${user.role}${user.branch ? ' — ' + formatBranch(user.branch) : ''})` : "Admin";
  // separate state for center dropdowns (bookings/branch) and right-side profile menu
  const [centerMenu, setCenterMenu] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  // change the active branch for the current user
  const handleSelectBranch = async (branch) => {
    try {
      // enforce a default branch of 'A' when none provided
      const toSend = branch || 'A';
      const res = await fetch(`${BACKEND_BASE}/api/auth/branch`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch: toSend }),
      });

      if (res.ok) {
        try { toast({ title: 'Branch updated', description: `Active branch: ${toSend}` }) } catch(e){}
        // persist selected branch locally for client-side components and notify listeners
        try { localStorage.setItem('selectedBranch', toSend); } catch(e){}
        try { window.dispatchEvent(new Event('branch-changed')); } catch(e){}
        await loadUser();
        setCenterMenu(null);
      } else {
        const d = await res.json().catch(() => ({}));
        const msg = d?.message || 'Could not change branch';
        try { toast({ title: 'Change branch failed', description: msg, variant: 'destructive' }) } catch(e){}
      }
    } catch (err) {
      try { toast({ title: 'Network error', description: 'Could not reach server', variant: 'destructive' }) } catch(e){}
    }
  }

  useEffect(() => {
    if (!profileMenuOpen) return;
    function handleDoc(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setProfileMenuOpen(false);
    }
    document.addEventListener("pointerdown", handleDoc);
    return () => document.removeEventListener("pointerdown", handleDoc);
  }, [profileMenuOpen]);

  return (
    <nav className="cb-navbar">
      <div className="cb-navbar-left">
        <Link href="/" className="cb-logo">🎬 CineBook</Link>
      </div>

      <div className="cb-navbar-center">
        <Link href="/" className="cb-link">Home</Link>
        {user && (
          <div className="cb-dropdown" onMouseEnter={() => setCenterMenu('bookings')} onMouseLeave={() => setCenterMenu(null)}>
            <button className="cb-link" type="button">Bookings </button>
            {centerMenu === 'bookings' && (
              <div className="cb-dropdown-menu">
                <Link href="/bookings" className="cb-dropdown-item">Booking History</Link>
                <Link href="/bookings/refund" className="cb-dropdown-item">Refund</Link>
              </div>
            )}
          </div>
        )}
        {user && (
          <div className="cb-dropdown" onMouseEnter={() => setCenterMenu('branch')} onMouseLeave={() => setCenterMenu(null)}>
            <button className="cb-link" type="button">Branch </button>
            {centerMenu === 'branch' && (
                  <div className="cb-dropdown-menu">
                    <button className="cb-dropdown-item" type="button" onClick={() => handleSelectBranch('A')}>Branch A</button>
                    <button className="cb-dropdown-item" type="button" onClick={() => handleSelectBranch('B')}>Branch B</button>
                    <button className="cb-dropdown-item" type="button" onClick={() => handleSelectBranch('C')}>Branch C</button>
                  </div>
                )}
          </div>
        )}
        {canViewFunction && (
          <div className="cb-dropdown" onMouseEnter={() => setCenterMenu('function')} onMouseLeave={() => setCenterMenu(null)}>
            <button className="cb-link" type="button">Function </button>
            {centerMenu === 'function' && (
              <div className="cb-dropdown-menu">
                <Link href="/profile/users" className="cb-dropdown-item">User Manage</Link>
                <Link href="/profile/movies" className="cb-dropdown-item">Movie Manage</Link>
                <Link href="/admin/auditlogs" className="cb-dropdown-item">Audit Logs</Link>
                <Link href="/profile/requests" className="cb-dropdown-item">Requests</Link>
                <Link href="/profile/statements" className="cb-dropdown-item">Statements</Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="cb-navbar-right" style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              className="btn-link"
              onClick={() => setProfileMenuOpen((s) => !s)}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              style={{ display: "flex", gap: 8, alignItems: "center" }}
            >
              <span style={{ fontWeight: 600 }}>{user.email?.split("@")[0] || user.username || user.email}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>{user.role}{user.branch ? ` • ${formatBranch(user.branch)}` : ""}</span>
            </button>

            {profileMenuOpen && (
              <div className="cb-menu" role="menu" style={{ position: "absolute", right: 0, marginTop: 8, background: "#1e293b", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 6, boxShadow: "0 6px 18px rgba(0,0,0,0.2)", padding: 8, minWidth: 220 }}>
                <Link href="/profile" className="cb-menu-item" role="menuitem">Profile Home</Link>
                <Link href="/profile/users" className="cb-menu-item" role="menuitem">User Panel</Link>
                <Link href="/profile/statements" className="cb-menu-item" role="menuitem">Statements</Link>
                <Link href="/profile/requests" className="cb-menu-item" role="menuitem">Requests Panel</Link>
                <Link href="/bookings" className="cb-menu-item" role="menuitem">My Bookings</Link>
                {/* Admin/function links are now available under the Function dropdown in the center nav */}
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
