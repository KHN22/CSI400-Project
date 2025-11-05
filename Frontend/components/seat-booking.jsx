"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import "../styles/seat-booking.css";

const ROWS = ["A", "B", "C", "D", "E", "F"];
const SEATS_PER_ROW = 8;

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function SeatBooking(props) {
  const { movie, showtime: initialShowtime, showtimes } = props;
  const router = useRouter();
  const [selectedShowtime, setSelectedShowtime] = useState(initialShowtime || showtimes[0]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // fetch already booked seats for this movie+showtime from backend (optional)
  const [booked, setBooked] = useState([]); // NEW: holds already-booked seats

  useEffect(() => {
    let mounted = true;
    async function loadBooked() {
      try {
        const movieId = movie?._id || movie?.id;
        const st = selectedShowtime;
        if (!movieId || !st) {
          if (mounted) setBooked([]);
          return;
        }
        const url = `${BACKEND_BASE}/api/bookings/movie/${movieId}?showtime=${encodeURIComponent(st)}`;
        const res = await fetch(url); // public endpoint
        if (!res.ok) {
          if (mounted) setBooked([]);
          return;
        }
        const data = await res.json();
        if (!mounted) return;
        setBooked(Array.isArray(data.seats) ? data.seats : []);
      } catch (err) {
        if (mounted) setBooked([]);
      }
    }
    loadBooked();
    return () => { mounted = false; };
  }, [movie, selectedShowtime]);

  function toggleSeat(r, c) {
    const id = `${r}${c}`;
    if (booked.includes(id)) return; // cannot select booked
    setSelectedSeats(prev => {
      if (prev.includes(id)) return prev.filter(s => s !== id);
      return [...prev, id].slice(0, 10); // limit 10 seats
    });
  }

  // คำนวณราคารวมจากราคาตั๋วคูณจำนวนที่นั่ง
  const totalPrice = selectedSeats.length * (movie.ticketPrice || 0);

  async function confirmBooking() {
    if (selectedSeats.length === 0) {
      setError("Please select at least one seat");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // ตรวจสอบว่าล็อกอินอยู่ ถ้าไม่อยู่ให้ไปหน้า login (preserve redirect)
      const check = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000"}/api/auth/check`, {
        credentials: "include"
      });

      if (!check.ok) {
        // redirect to login, keep return path
        router.push(`/login?redirect=/movie/${movie._id || movie.id}`);
        return;
      }

      // สร้าง draft booking ใน sessionStorage แทนการ POST ตอนนี้
      const ticketPrice = Number(movie.ticketPrice || 0);
      const totalPrice = selectedSeats.length * ticketPrice;
      const draft = {
        movieId: movie._id || movie.id,
        title: movie.title,
        showtime: selectedShowtime,
        seats: selectedSeats,
        ticketPrice,
        totalPrice
      };
      sessionStorage.setItem("pendingBooking", JSON.stringify(draft));

      // ไปที่หน้า payment แบบ draft (dynamic route [id] จะรับค่า 'draft')
      router.push(`/payment/draft`);
    } catch (err) {
      console.error("[SeatBooking] confirm error:", err);
      setError(err.message || "Failed to proceed to payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="seat-booking">
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
            Showtime: {selectedShowtime} • {new Date().toLocaleDateString()}
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
              {ROWS.map((r) => (
                <div className="seat-row" key={r}>
                  <div className="row-label">{r}</div>
                  <div className="seat-columns">
                    {Array.from({ length: SEATS_PER_ROW }).map((_, i) => {
                      const col = i + 1;
                      const id = `${r}${col}`;
                      const isBooked = booked.includes(id);
                      const isSelected = selectedSeats.includes(id);
                      let cls = "seat-button";
                      if (isBooked) cls += " booked";
                      else if (isSelected) cls += " selected";
                      else cls += " available";
                      return (
                        <button key={id} className={cls} onClick={()=>toggleSeat(r,col)} disabled={isBooked}>
                          {col}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="seat-legend">
            <div className="legend-item"><span className="legend-box available" /> Available</div>
            <div className="legend-item"><span className="legend-box selected" /> Selected</div>
            <div className="legend-item"><span className="legend-box booked" /> Booked</div>
          </div>
        </div>

        {/* Booking Summary */}
        <aside className="summary-card">
          <h2>Summary</h2>
          <div className="summary-details">
            <div className="summary-row"><div className="summary-label">Movie</div><div className="summary-value">{movie.title}</div></div>
            <div className="summary-row"><div className="summary-label">Showtime</div><div className="summary-value">{selectedShowtime}</div></div>
            <div className="summary-row"><div className="summary-label">Seats</div><div className="summary-value">{selectedSeats.join(", ") || "-"}</div></div>
            <div className="summary-total-row">
              <div className="summary-total">Total</div>
              <div className="summary-total-amount">฿{totalPrice.toLocaleString()}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="confirm-button" onClick={confirmBooking} disabled={loading}>
                {loading ? "Processing…" : "Proceed to Payment (mock)"}
              </button>
            </div>
            {error && <div style={{ marginTop: 10, color: error.startsWith("Booking created") ? "green" : "red" }}>{error}</div>}
          </div>
        </aside>
      </div>
    </div>
  );
}
