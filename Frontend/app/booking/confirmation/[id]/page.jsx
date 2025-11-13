"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import "@/styles/booking-history.css";
import { BACKEND_BASE } from "@/lib/api";

export default function BookingConfirmationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`${BACKEND_BASE}/api/bookings/${id}`, { credentials: "include" });
        if (!res.ok) {
          if (res.status === 401) { router.push(`/login?redirect=/booking/confirmation/${id}`); return; }
          const txt = await res.text().catch(()=>null);
          throw new Error(txt || `Failed to load booking (${res.status})`);
        }
        const d = await res.json();
        if (!mounted) return;
        setBooking(d.booking || d);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load booking");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div style={{padding:20}}>Loading confirmation…</div>;
  if (error) return <div style={{padding:20,color:'#f87171'}}>Error: {error}</div>;
  if (!booking) return <div style={{padding:20}}>Booking not found</div>;

  const title = booking.movie?.title || booking.title || "Movie";
  const seats = booking.seats || [];
  const showtime = booking.showtime;
  const total = booking.totalPrice || (booking.ticketPrice * seats.length) || 0;

  return (
    <div style={{ padding: 20 }}>
      <h1>Booking Confirmed</h1>
      <div style={{ padding: 16, background:'#071018', borderRadius:8, color:'#cfe0ff' }}>
        <div><strong>{title}</strong></div>
        <div>Showtime: {showtime}</div>
        <div>Seats: {seats.join(", ")}</div>
        <div>Total: ฿{Number(total).toLocaleString()}</div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/bookings")}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#6366f1",
                border: "none",
                cursor: "pointer"
              }}
            >
              View Booking History
            </button>
            <button
              onClick={() => router.push(`/movie/${booking.movie?._id || booking.movieId || booking.movie?.id}`)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#6366f1",
                border: "none",
                cursor: "pointer"
              }}
            >
              Back to Movie
            </button>
            <button
              onClick={() => { if (typeof window !== "undefined") window.print(); }}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                background: "#6366f1",
                border: "none",
                cursor: "pointer"
              }}
            >
              Download Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}