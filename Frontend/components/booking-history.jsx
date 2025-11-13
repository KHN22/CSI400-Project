"use client"

import React, { useEffect, useState } from "react"
import { bookingsApi, BACKEND_BASE } from "@/lib/api"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import "../styles/booking-history.css"

export default function BookingHistory() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const res = await fetch(`${BACKEND_BASE}/api/bookings`, { credentials: "include" })
        if (!mounted) return
        if (!res.ok) {
          setBookings([])
          return
        }
        const d = await res.json()
        setBookings(d.bookings || [])
      } catch {
        if (mounted) setBookings([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
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

  if (!bookings || bookings.length === 0) {
    return (
      <div className="empty-state">
        <Ticket />
        <h2>No bookings yet</h2>
        <p>Start booking your favorite movies to see them here!</p>
      </div>
    )
  }

  return (
    <div>
      <h2>Your bookings</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {bookings.map(b => (
          <li key={b._id || b.id} className="card" style={{ marginBottom: 10 }}>
            <div><strong>{b.title}</strong></div>
            <div><small className="text-muted">{b.showtime}</small></div>
            <div>Seats: {(b.seats || []).join(", ")}</div>
            <div><small className="text-muted">Booked: {new Date(b.createdAt).toLocaleString()}</small></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
}
