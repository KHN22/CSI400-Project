"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "@/styles/buttons.css";
import { BACKEND_BASE } from "../lib/api";
import { toast } from '@/hooks/use-toast'

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    // show a brief toast to confirm logout
    try {
      toast({ title: 'Logged out', description: 'You have been signed out.' })
    } catch (e) {}
    try { window.dispatchEvent(new Event("auth-changed")); } catch(e){}
    try { localStorage.setItem("auth", String(Date.now())); } catch(e){}
    try { new BroadcastChannel("auth").postMessage("changed"); } catch(e){}

    try { router.push("/login"); } catch(e){}
  };

  return (
    <button onClick={handleLogout} className="btn-outline-blue" aria-label="Logout" type="button">
      Logout
    </button>
  );
}