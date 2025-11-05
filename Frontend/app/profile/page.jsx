"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: "include" });
        if (res.status === 401) { router.push("/login"); return; }
        const d = await res.json();
        if (mounted) setUser(d.user || null);
      } catch {
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="profile-loading">Loading profile…</div>;
  if (!user) return <div className="profile-error">Not signed in.</div>;

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account and view profile details.</p>
      </header>

      <section className="profile-card">
        <div className="profile-form">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              <div className="profile-avatar-fallback">{(user.email || "U")[0].toUpperCase()}</div>
            </div>
            <div className="profile-avatar-info">
              <h2>{user.email}</h2>
              <p className="text-muted">Role: {user.role}</p>
              <p className="text-muted">UserId: {user.id}</p>
            </div>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <label>Email</label>
              <input type="email" value={user.email} readOnly />
            </div>

            <div className="profile-field">
              <label>Role</label>
              <input type="text" value={user.role} readOnly />
            </div>
          </div>

          <div className="profile-actions">
            <button className="profile-save-button" disabled>
              Save changes
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
