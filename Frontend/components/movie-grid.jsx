"use client";
import React, { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import "../styles/movie-card.css";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
console.log("[MovieGrid] BACKEND_BASE:", BACKEND_BASE);

export function MovieGrid() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        // เพิ่ม credentials และ headers
        const res = await fetch(`${BACKEND_BASE}/api/movies`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });
        
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
    load();
    return () => { mounted = false; }
  }, []);

  if (loading) return <div className="card">Loading movies…</div>;
  if (err) return <div className="card" style={{ color: "red" }}>{err}</div>;
  if (!movies || movies.length === 0) {
    return (
      <div className="card">
        <div>No movies available.</div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
          Add movies in <a href="/admin" style={{ textDecoration: "underline" }}>/admin</a>
        </div>
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
