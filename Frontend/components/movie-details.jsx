"use client";
import React from "react";
import { useRouter } from "next/navigation";
import "../styles/movie-details.css";

export default function MovieDetails({ movie, selectedShowtime }) {
  const router = useRouter();

  function bookShowtime(time) {
    if (!movie?._id) {
      console.error("[MovieDetails] Invalid movie ID");
      return;
    }

    sessionStorage.setItem('lastMovieId', movie._id);
    // เพิ่มราคาตั๋วใน URL parameters
    const ticketPrice = movie.ticketPrice || 0;
    router.push(`/booking/${movie._id}?showtime=${encodeURIComponent(time)}&price=${ticketPrice}`);
  }

  return (
    <div className="movie-details">
      <div className="movie-details-container">
        <div className="movie-poster">
          <img src={movie.poster || "/placeholder.svg"} alt={movie.title} />
        </div>

        <div className="movie-content">
          <h1 className="movie-title">
            {movie.title}
            {movie.year && <span className="movie-year">({movie.year})</span>}
          </h1>

          <div className="movie-meta">
            <div className="movie-price">
              <span className="price-label">Ticket Price:</span>
              <span className="price-value">
                ฿{Number(movie.ticketPrice).toLocaleString()}
              </span>
            </div>
            {movie.duration && (
              <div className="movie-duration">{movie.duration}</div>
            )}
            {movie.genre && (
              <div className="movie-genre">{movie.genre}</div>
            )}
          </div>

          <p className="movie-description">{movie.description}</p>

          <div className="showtimes-card">
            <div className="showtimes-header">
              <h2>Available Showtimes</h2>
            </div>

            {(!movie.showtimes || movie.showtimes.length === 0) ? (
              <div className="no-showtimes">
                No showtimes available for this movie.
              </div>
            ) : (
              <div className="showtimes-grid">
                {movie.showtimes.map((time) => (
                  <button
                    key={time}
                    className={`showtime-button ${selectedShowtime === time ? 'selected' : ''}`}
                    onClick={() => bookShowtime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
