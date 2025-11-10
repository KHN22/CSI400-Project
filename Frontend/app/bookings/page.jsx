"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import { BookingHistory } from "@/components/booking-history"
import "@/styles/booking-history.css"

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError("")
      try {
        const res = await fetch(`${BACKEND_BASE}/api/bookings`, { credentials: "include" })
        if (res.status === 401) { router.push("/login"); return }
        if (!res.ok) { setError("Failed to load bookings"); return }
        const d = await res.json()
        if (mounted) setBookings(d.bookings || [])
      } catch {
        if (mounted) setError("Network error")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div style={{ padding: 20, color: "#fff" }}>Loading bookings…</div>
  if (error) return <div style={{ padding: 20, color: "#f87171" }}>{error}</div>
  if (bookings.length === 0) return <div style={{ padding: 20, color: "#fff" }}>You have no bookings yet.</div>

  return (
    <div className="container">
      <div className="booking-history-container">
        <div className="booking-history-header">
          <h1>Booking History</h1>
          <p>View all your past and upcoming movie bookings</p>
        </div>
        <div style={{ padding: 20 }}>
          <h1 style={{ color: "#fff" }}>Your Bookings</h1>
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {bookings.map(b => {
              const seats = b.seats || []
              const seatsStr = Array.isArray(seats) ? seats.join(", ") : seats
              const ticketsCount = Array.isArray(seats) ? seats.length : (b.tickets || 0)
              const total = b.totalPrice ?? (b.ticketPrice ? (b.ticketPrice * ticketsCount) : (b.total || 0))
              const showtimeStr = b.showtime || ""
              let dateLabel = showtimeStr
              let timeLabel = ""
              if (showtimeStr && showtimeStr.includes("T")) {
                const dt = new Date(showtimeStr)
                if (!isNaN(dt)) {
                  dateLabel = dt.toLocaleDateString()
                  timeLabel = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
              } else if (showtimeStr.includes(" ")) {
                const parts = showtimeStr.split(" ")
                dateLabel = parts[0]
                timeLabel = parts.slice(1).join(" ")
              }
              const isConfirmed = (b.status && String(b.status).toLowerCase() === "confirmed") || b.confirmed === true

              return (
                <li key={b._id} className={`booking-card ${isConfirmed ? "confirmed" : ""}`} style={{ marginBottom: 12 }}>
                  <div className="booking-card-content">
                    <div className="booking-info">
                      <div className="booking-title-row">
                        <div className="booking-title" style={{ color: "#fff" }}>{b.title}</div>
                        {isConfirmed && <div className="booking-badge confirmed">Confirmed</div>}
                      </div>

                      <div className="booking-meta">

                       <div className="movie-title-box">
          🎬 {b.title || b.movieTitle || b.movie || b.movieName || ""}
        </div>

                        <div className="booking-meta-item">
                          <Calendar />
                          <span>    
    {b.date
      ? new Date(b.date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : b.date
      ? new Date(b.date).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : "ยังไม่ระบุวันที่"}
  </span>
                        </div>

                        <div className="booking-meta-item">
                          <Clock />
                          <span>{timeLabel || (b.showtime || "")}</span>
                        </div>

                        <div className="booking-meta-item">
                          <MapPin />
                          <span style={{ color: "#aeb7c6" }}>{seatsStr}</span>
                        </div>
                        
                        <div className="booking-meta-item tickets">
                          <Ticket />
                          <span>{ticketsCount} ticket{ticketsCount !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="booking-price">
                      <div className="booking-price-label">Total</div>
                      <div className="booking-price-value">฿{Number(total || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  )
}
