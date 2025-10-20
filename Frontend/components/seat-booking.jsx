"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SEAT_ROWS, SEAT_COLUMNS, SEAT_PRICE, getBookedSeats } from "@/lib/mock-data"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import "../styles/seat-booking.css"

export function SeatBooking({ movie, showtime }) {
  const router = useRouter()
  const [selectedSeats, setSelectedSeats] = useState([])

  const bookedSeats = useMemo(() => getBookedSeats(movie.id, showtime), [movie.id, showtime])

  const toggleSeat = (seat) => {
    if (bookedSeats.includes(seat)) return

    setSelectedSeats((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]))
  }

  const getSeatStatus = (seat) => {
    if (bookedSeats.includes(seat)) return "booked"
    if (selectedSeats.includes(seat)) return "selected"
    return "available"
  }

  const totalPrice = selectedSeats.length * SEAT_PRICE

  const handleConfirmBooking = () => {
    if (selectedSeats.length > 0) {
      const bookingData = {
        movieId: movie.id,
        movieTitle: movie.title,
        showtime,
        seats: selectedSeats,
        total: totalPrice,
      }
      router.push(`/payment?data=${encodeURIComponent(JSON.stringify(bookingData))}`)
    }
  }

  return (
    <div className="seat-booking-container">
      {/* Header */}
      <div className="booking-header">
        <Link href={`/movie/${movie.id}`}>
          <button className="back-button">
            <ArrowLeft />
          </button>
        </Link>
        <div>
          <h1>{movie.title}</h1>
          <p>
            Showtime: {showtime} • {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="booking-layout">
        {/* Seat Grid */}
        <div className="seat-section">
          {/* Screen */}
          <div className="screen-indicator">
            <div className="screen-line" />
            <p className="screen-text">SCREEN</p>
          </div>

          {/* Seats */}
          <div className="seat-grid-container">
            <div className="seat-grid">
              {SEAT_ROWS.map((row) => (
                <div key={row} className="seat-row">
                  <span className="row-label">{row}</span>
                  <div className="seat-columns">
                    {SEAT_COLUMNS.map((col) => {
                      const seatId = `${row}${col}`
                      const status = getSeatStatus(seatId)

                      return (
                        <button
                          key={seatId}
                          onClick={() => toggleSeat(seatId)}
                          disabled={status === "booked"}
                          className={`seat-button ${status}`}
                          aria-label={`Seat ${seatId} - ${status}`}
                        >
                          {col}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="seat-legend">
            <div className="legend-item">
              <div className="legend-box available" />
              <span className="legend-text">Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-box selected" />
              <span className="legend-text">Selected</span>
            </div>
            <div className="legend-item">
              <div className="legend-box booked" />
              <span className="legend-text">Booked</span>
            </div>
          </div>
        </div>

        {/* Booking Summary */}
        <div className="summary-card">
          <h2>Booking Summary</h2>

          <div className="summary-details">
            <div className="summary-row">
              <span className="summary-label">Movie</span>
              <span className="summary-value">{movie.title}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Showtime</span>
              <span className="summary-value">{showtime}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Date</span>
              <span className="summary-value">{new Date().toLocaleDateString()}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Seats</span>
              <span className="summary-value">{selectedSeats.length > 0 ? selectedSeats.join(", ") : "None"}</span>
            </div>
          </div>

          <div className="summary-total">
            <div className="summary-row">
              <span className="summary-label">Price per seat</span>
              <span>${SEAT_PRICE.toFixed(2)}</span>
            </div>
            <div className="summary-total-row">
              <span>Total</span>
              <span className="summary-total-amount">${totalPrice.toFixed(2)}</span>
            </div>
          </div>

          <button onClick={handleConfirmBooking} disabled={selectedSeats.length === 0} className="confirm-button">
            {selectedSeats.length > 0 ? "Confirm Booking" : "Select Seats"}
          </button>
        </div>
      </div>
    </div>
  )
}
