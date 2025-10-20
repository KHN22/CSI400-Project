"use client"

import { useEffect, useState } from "react"
import { bookingsApi } from "@/lib/api"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import "../styles/booking-history.css"

export function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const data = await bookingsApi.getAll()
        setBookings(data)
      } catch (error) {
        console.error("Failed to fetch bookings:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBookings()
  }, [])

  if (loading) {
    return (
      <div className="loading-skeleton">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-item" />
        ))}
      </div>
    )
  }

  if (bookings.length === 0) {
    return (
      <div className="empty-state">
        <Ticket />
        <h2>No bookings yet</h2>
        <p>Start booking your favorite movies to see them here!</p>
      </div>
    )
  }

  return (
    <div className="bookings-list">
      {bookings.map((booking) => (
        <div key={booking.id} className="booking-card">
          <div className="booking-card-content">
            <div className="booking-info">
              <div className="booking-title-row">
                <h3 className="booking-title">{booking.movieTitle}</h3>
                <span className={`booking-badge ${booking.status}`}>{booking.status}</span>
              </div>

              <div className="booking-meta">
                <div className="booking-meta-item">
                  <Calendar />
                  <span>{new Date(booking.date).toLocaleDateString()}</span>
                </div>

                <div className="booking-meta-item">
                  <Clock />
                  <span>{booking.showtime}</span>
                </div>

                <div className="booking-meta-item">
                  <MapPin />
                  <span>Seats: {booking.seats.join(", ")}</span>
                </div>

                <div className="booking-meta-item tickets">
                  <Ticket />
                  <span>{booking.seats.length} Tickets</span>
                </div>
              </div>
            </div>

            <div className="booking-price">
              <span className="booking-price-label">Total Amount</span>
              <span className="booking-price-value">${booking.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
