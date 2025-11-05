"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import SeatBooking from "@/components/seat-booking";

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function BookingPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const showtime = searchParams?.get("showtime");

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!id || !showtime) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${BACKEND_BASE}/api/movies/${id}`, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
          }
        });

        console.log("[BookingPage] fetch response:", {
          url: res.url,
          status: res.status,
          statusText: res.statusText
        });

        if (!res.ok) {
          if (res.status === 401) {
            // Redirect to login if unauthorized
            window.location.href = `/login?redirect=/booking/${id}?showtime=${showtime}`;
            return;
          }
          if (res.status === 404) throw new Error("Movie not found");
          throw new Error(`Failed to load movie (${res.status})`);
        }

        const data = await res.json();
        if (!mounted) return;
        setMovie(data.movie || data);
      } catch (err) {
        console.error("[BookingPage] error:", err);
        if (mounted) setError(err.message || "Failed to load movie");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id, showtime]);

  if (!showtime) return <div className="card">No showtime selected</div>;
  if (loading) return <div className="card">Loading movie details...</div>;
  if (error) return <div className="card" style={{ color: "red" }}>{error}</div>;
  if (!movie) return <div className="card">Movie not found</div>;

  return <SeatBooking movie={movie} showtime={showtime} />;
}
