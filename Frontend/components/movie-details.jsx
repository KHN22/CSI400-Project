"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../styles/movie-details.css";

export default function MovieDetails({ movie, selectedShowtime }) {
  const router = useRouter();

  // local selection state (init from prop if provided)
  const [selectedTime, setSelectedTime] = useState(selectedShowtime || "");

  useEffect(() => {
    if (selectedShowtime) setSelectedTime(selectedShowtime);
  }, [selectedShowtime]);

  function navigateToBooking(time) {
    if (!movie?._id) {
      console.error("[MovieDetails] Invalid movie ID");
      return;
    }
    sessionStorage.setItem("lastMovieId", movie._id);
    const ticketPrice = movie.ticketPrice || 0;
    router.push(`/booking/${movie._id}?showtime=${encodeURIComponent(time)}&price=${ticketPrice}`);
  }

  // Called when confirming the selected time
  function confirmSelection() {
    if (!selectedTime) return;
    navigateToBooking(selectedTime);
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
                ฿{Number(movie.ticketPrice || 0).toLocaleString()}
              </span>
            </div>
            {movie.duration && <div className="movie-duration">{movie.duration}</div>}
            {movie.genre && <div className="movie-genre">{movie.genre}</div>}
          </div>

          <p className="movie-description">{movie.description}</p>

          <div className="showtimes-card">
            <div className="showtimes-header">
              <h2>Available Showtimes</h2>
            </div>

            {(!movie.showtimes || movie.showtimes.length === 0) ? (
              <div className="no-showtimes">No showtimes available for this movie.</div>
            ) : (
              <div>
                <div className="showtimes-grid">
                  {movie.showtimes.map((time) => (
                    <button
                      key={time}
                      className={`showtime-button ${selectedTime === time ? "selected" : ""}`}
                      onClick={() => setSelectedTime(time)}
                      type="button"
                    >
                      {time}
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn-outline-blue"
                    onClick={confirmSelection}
                    disabled={!selectedTime}
                    aria-disabled={!selectedTime}
                    style={{ padding: "8px 12px", borderRadius: 6 }}
                  >
                    Confirm
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTime("")}
                    className="btn-outline-blue"
                    style={{ background: "transparent", padding: "8px 12px", borderRadius: 6 }}
                  >
                    Clear
                  </button>

                  <div style={{ color: "#9aa3b3", fontSize: 13 }}>
                    {selectedTime ? `Selected: ${selectedTime}` : "No showtime selected"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
