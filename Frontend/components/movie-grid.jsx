"use client";
import React, { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import "../styles/movie-card.css";
import { BACKEND_BASE } from "../lib/api";
console.log("[MovieGrid] BACKEND_BASE:", BACKEND_BASE);

export function MovieGrid() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [me, setMe] = useState(null);
  // load current user (me) separately
  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      try {
        const r = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: 'include' });
        if (!mounted) return;
        if (r.ok) {
          const p = await r.json().catch(() => null);
          const u = p?.user || p || null;
          setMe(u);
        } else {
          setMe(null);
        }
      } catch (e) {
        if (mounted) setMe(null);
      }
    }
    loadMe();
    return () => { mounted = false };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setErr("");
      try {
        // Determine selected branch: prefer localStorage, fall back to user's branch from /api/auth/me
        let selectedBranch = 'A';
        try { selectedBranch = localStorage.getItem('selectedBranch') || 'A' } catch(e) { selectedBranch = 'A' }
        if (!selectedBranch) {
          try {
            const r = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: 'include' });
            if (r.ok) {
              const p = await r.json().catch(()=>null);
              const u = p?.user || p || null;
              if (u && u.branch) selectedBranch = u.branch;
            }
          } catch(e) { /* ignore */ }
        }
        const url = new URL(`${BACKEND_BASE}/api/movies`);
        if (selectedBranch) url.searchParams.set('branch', selectedBranch);
        const res = await fetch(url.toString(), { credentials: 'include', headers: { 'Accept': 'application/json' } });
        
        console.log("[MovieGrid] fetch response:", {
          url: res.url,
          status: res.status,
          statusText: res.statusText
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("[MovieGrid] error response:", text);
          throw new Error(`Failed to load movies (${res.status})`);
        }

        const data = await res.json();
        console.log("[MovieGrid] movies data:", data);
        
        if (!mounted) return;
        const list = Array.isArray(data) ? data : (data?.movies || []);
        setMovies(list);
      } catch (e) {
        console.error("[MovieGrid] error:", e);
        if (mounted) setErr(e.message || "Failed to load movies");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    // reload when branch or reviews change
    function onBranchChange(e) { load(); }
    function onReviewsChanged(e) { load(); }
    window.addEventListener('branch-changed', onBranchChange);
    window.addEventListener('reviews-changed', onReviewsChanged);
    load();
    return () => { mounted = false; window.removeEventListener('branch-changed', onBranchChange); window.removeEventListener('reviews-changed', onReviewsChanged); }
  }, []);

  if (loading) return <div className="card">Loading movies…</div>;
  if (err) return <div className="card" style={{ color: "red" }}>{err}</div>;
  if (!movies || movies.length === 0) {
    return (
      <div className="card">
        <div>No movies available.</div>
        {me && ['SuperAdmin','Manager','Staff'].includes(me.role) ? (
          <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
            Add movies in <a href="/admin" style={{ textDecoration: "underline" }}>/admin</a>
          </div>
        ) : (
          <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
            Movies are not available. Contact an administrator to add movies.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="movie-grid" data-test="movie-grid">
      {movies.map(m => {
        console.log("[MovieGrid] rendering movie:", m._id, m.title);
        return <MovieCard key={m._id || m.id} movie={m} />;
      })}
    </div>
  );
}
