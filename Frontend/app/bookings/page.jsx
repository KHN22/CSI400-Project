"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, MapPin, Ticket } from "lucide-react"
import "@/styles/booking-history.css"
import { BACKEND_BASE } from "@/lib/api";

export default function BookingsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const router = useRouter()

  function looksLikeObjectId(s) {
    return typeof s === "string" && /^[0-9a-fA-F]{24}$/.test(s)
  }

  function resolveTitle(b) {
    if (!b) return ""
    if (b.title) return b.title
    if (b.movieTitle) return b.movieTitle
    if (b.movieName) return b.movieName
    if (b.movie && typeof b.movie === "object") {
      return b.movie.title || b.movie.name || b.movie.movieTitle || ""
    }
    if (typeof b.movie === "string" && !looksLikeObjectId(b.movie)) return b.movie
    return ""
  }

  // New: resolve description from booking/movie object
  function resolveDescription(b) {
    if (!b) return ""
    if (b.description) return b.description
    if (b.movie && typeof b.movie === "object") {
      return b.movie.description || b.movie.synopsis || b.movie.summary || ""
    }
    return ""
  }

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
        const raw = d.bookings || []

        const toFetch = raw.filter(b => {
          const t = resolveTitle(b)
          return !t && (looksLikeObjectId(b.movie) || looksLikeObjectId(b.movieId) || b.movieId)
        })

        if (toFetch.length > 0) {
          await Promise.all(toFetch.map(async (b) => {
            try {
              const movieId = b.movie?._id || (looksLikeObjectId(b.movie) ? b.movie : null) || (looksLikeObjectId(b.movieId) ? b.movieId : b.movieId)
              if (!movieId) return
              const mr = await fetch(`${BACKEND_BASE}/api/movies/${movieId}`, { credentials: "include" })
              if (!mr.ok) return
              const md = await mr.json()
              const movieObj = md.movie || md
              if (movieObj) {
                b.movie = movieObj
                b.title = movieObj.title || movieObj.name || b.title
                b.description = movieObj.description || b.description
              }
            } catch (e) {
              // ignore per-item errors
            }
          }))
        }

        if (mounted) setBookings(raw)
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
              const title = resolveTitle(b) || "Untitled movie"
              const description = resolveDescription(b) || "No description available"
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

              // shorten description for display
              const shortDesc = description.length > 120 ? description.slice(0, 120) + "…" : description

              return (
                <li key={b._id || b.id || Math.random()} className={`booking-card ${isConfirmed ? "confirmed" : ""}`} style={{ marginBottom: 12 }}>
                  <div className="booking-card-content">
                    <div className="booking-info">
                      <div className="booking-title-row">
                        <div className="booking-title" style={{ color: "#fff" }}>🎬 {title}</div>
                        {isConfirmed && <div className="booking-badge confirmed">Confirmed</div>}
                      </div>

                      <div className="booking-meta">
                        {/* show description here instead of repeating title */}
                        <div className="movie-title-box" title={description}>
                          {shortDesc}
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
