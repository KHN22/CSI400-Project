"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Star, Clock, Calendar } from "lucide-react"
import { useState } from "react"
import "../styles/movie-details.css"

export function MovieDetails({ movie }) {
  const router = useRouter()
  const [selectedShowtime, setSelectedShowtime] = useState("")

  const handleBooking = () => {
    if (selectedShowtime) {
      router.push(`/booking/${movie.id}?showtime=${encodeURIComponent(selectedShowtime)}`)
    }
  }

  return (
    <div className="movie-details-container">
      {/* Movie Poster */}
      <div className="movie-poster">
        <Image
          src={movie.poster || "/placeholder.svg"}
          alt={movie.title}
          fill
          style={{ objectFit: "cover" }}
          priority
        />
      </div>

      {/* Movie Info */}
      <div className="movie-info">
        <div>
          <h1 className="movie-title">{movie.title}</h1>

          <div className="movie-meta">
            <div className="movie-rating">
              <Star />
              <span className="movie-rating-value">{movie.rating}</span>
              <span>/10</span>
            </div>
            <div className="movie-duration">
              <Clock />
              <span>{movie.duration}</span>
            </div>
            <div className="movie-genre">{movie.genre}</div>
          </div>

          <p className="movie-description">{movie.description}</p>
        </div>

        {/* Showtimes Selection */}
        <div className="showtimes-card">
          <div className="showtimes-header">
            <Calendar />
            <h2>Select Showtime</h2>
          </div>

          <div className="showtimes-grid">
            {movie.showtimes.map((time) => (
              <button
                key={time}
                onClick={() => setSelectedShowtime(time)}
                className={`showtime-button ${selectedShowtime === time ? "selected" : ""}`}
              >
                {time}
              </button>
            ))}
          </div>

          <button onClick={handleBooking} disabled={!selectedShowtime} className="booking-button">
            {selectedShowtime ? `Continue to Seat Selection` : "Select a Showtime"}
          </button>
        </div>
      </div>
    </div>
  )
}
