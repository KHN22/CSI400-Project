"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "../styles/movie-card.css";

export function MovieCard({ movie }) {
  const router = useRouter();

  // normalize id: support _id (string), id, or _id.$oid
  function normId(m) {
    if (!m) return null;
    if (typeof m._id === "string") return m._id;
    if (m._id && typeof m._id.$oid === "string") return m._id.$oid;
    if (typeof m.id === "string") return m.id;
    return null;
  }

  function openMovie() {
    const id = normId(movie);
    console.log("[MovieCard] navigate to movie id:", id, "movie:", movie);
    if (!id) return console.warn("[MovieCard] missing id, cannot navigate");
    router.push(`/movie/${id}`);
  }

  return (
    <div
      className="movie-card"
      role="button"
      onClick={openMovie}
      style={{ cursor: "pointer", pointerEvents: "auto" }}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") openMovie(); }}
    >
      <div className="movie-card-image" style={{ pointerEvents: "none" }}>
        <img
          src={movie.poster || "/placeholder.svg"}
          alt={movie.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>

      <div className="movie-card-content" style={{ pointerEvents: "none" }}>
        <h3 className="movie-card-title">{movie.title}</h3>
        <div className="movie-card-meta">
          <div className="movie-card-year">{movie.year}</div>
        </div>

        <div style={{ marginTop: 8 }}>
          <button
            className="btn"
            onClick={(evt) => { evt.stopPropagation(); openMovie(); }}
            style={{ pointerEvents: "auto" }}
          >
            View showtimes
          </button>
        </div>
      </div>
    </div>
  );
}
