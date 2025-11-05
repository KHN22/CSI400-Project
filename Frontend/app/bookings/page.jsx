"use client"
import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BookingHistory } from "@/components/booking-history"

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
            {bookings.map(b => (
              <li key={b._id} style={{ background: "#fff", marginBottom: 12, padding: 12, borderRadius: 8 }}>
                <div><strong>{b.title}</strong> — {b.showtime}</div>
                <div>Seats: {b.seats.join ? b.seats.join(", ") : b.seats}</div>
                <div>Booked at: {new Date(b.createdAt).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
