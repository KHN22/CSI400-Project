"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import AuthStatus from "./auth-status";
import "../styles/navbar.css";

export function Navbar() {
  const [user, setUser] = useState(null);
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    async function loadUser() {
      const res = await fetch('http://localhost:4000/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const { user } = await res.json();
        setUser(user);
      } else {
        setUser(null);
      }
    }
    loadUser();
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

      <div className="cb-navbar-right">
        <AuthStatus />
      </div>
    </nav>
  );
}
