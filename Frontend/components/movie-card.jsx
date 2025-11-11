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
          <div className="movie-card-description">{movie.description}</div>
        </div>
        <div className="movie-card-rating">
          <div
            className="movie-rating"
            style={{ visibility: movie.rating === undefined ? "hidden" : "visible" }}
          >
          ⭐{movie.rating === 0 || movie.rating === undefined ? "N/A" : movie.rating}
          </div>
          <div className="movie-lenght">{movie.length} min</div>
        </div>
        <div style={{ transform: "translateY(-5px)", fontSize: 12 , color: "#ffffff",opacity: 0.5}} className="movie-card-year">{movie.year}</div>


        <div style={{ marginTop: 8 }}>
          <button
            className="btn viewBtn"
            id="viewBtn"
            onClick={(evt) => { evt.stopPropagation(); openMovie(); }}
            style={{ pointerEvents: "auto", background: "#6366f1" }}
          >
            View showtimes
          </button>
        </div>
      </div>
    </div>
  );
}
