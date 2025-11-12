"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import "@/styles/payment.css";
import { BACKEND_BASE } from "@/lib/api";

export default function PaymentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentPageContent />
    </Suspense>
  );
}

function PaymentPageContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        if (id === "draft") {
          const raw = typeof window !== "undefined" ? sessionStorage.getItem("pendingBooking") : null;
          if (!raw) throw new Error("No pending booking found");
          const draft = JSON.parse(raw);
          if (!mounted) return;
          setBooking(draft);
          return;
        }

        const res = await fetch(`${BACKEND_BASE}/api/bookings/${id}`, { credentials: "include" });
        if (!res.ok) {
          const txt = await res.text().catch(()=>null);
          throw new Error(txt || `Failed to load booking (${res.status})`);
        }
        const data = await res.json();
        if (!mounted) return;
        setBooking(data.booking);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load booking");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    if (id) load();
    return () => { mounted = false; };
  }, [id]);

  async function confirmMockPayment() {
    if (!booking) return;
    setProcessing(true);
    setError("");
    try {
      if (id === "draft") {
        const check = await fetch(`${BACKEND_BASE}/api/auth/check`, { credentials: "include" });
        if (!check.ok) {
          router.push(`/login?redirect=/payment/draft`);
          return;
        }

        const res = await fetch(`${BACKEND_BASE}/api/bookings`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            movieId: booking.movieId,
            showtime: booking.showtime,
            seats: booking.seats,
            ticketPrice: booking.ticketPrice,
            totalPrice: booking.totalPrice,
            status: "paid"
          })
        });

        if (!res.ok) {
          const txt = await res.text().catch(()=>null);
          throw new Error(txt || `Failed to create booking (${res.status})`);
        }

        const data = await res.json();
        sessionStorage.removeItem("pendingBooking");
        router.push(`/booking/confirmation/${data.booking._id}`);
        return;
      }

      const res = await fetch(`${BACKEND_BASE}/api/bookings/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" })
      });
      if (!res.ok) {
        const txt = await res.text().catch(()=>null);
        throw new Error(txt || `Payment update failed (${res.status})`);
      }
      router.push(`/booking/confirmation/${id}`);
    } catch (err) {
      console.error("[PaymentPage] confirm error:", err);
      setError(err.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  }

  // deterministic QR-like modules for mock
  function renderQrModules() {
    const modules = [];
    const rows = 21, cols = 21;
    const size = 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const inFinderTL = r < 6 && c < 6;
        const inFinderTR = r < 6 && c >= cols - 6;
        const inFinderBL = r >= rows - 6 && c < 6;
        if (inFinderTL || inFinderTR || inFinderBL) continue;
        const v = ((r * 37 + c * 17) % 5);
        if (v === 0 || v === 2) {
          modules.push(<rect key={`m-${r}-${c}`} x={8 + c*size} y={8 + r*size} width={size} height={size} fill="#111" />);
        } else if (v === 4) {
          modules.push(<rect key={`m2-${r}-${c}`} x={8 + c*size} y={8 + r*size} width={size} height={size} fill="#333" />);
        }
      }
    }
    return modules;
  }

  if (loading) return (
    <div className="payment-container">
      <div className="payment-header"><h1>Loading…</h1></div>
    </div>
  );
  if (error) return (
    <div className="payment-container">
      <div className="payment-header"><h1>Error</h1><p style={{color:'#f87171'}}>{error}</p></div>
    </div>
  );
  if (!booking) return (
    <div className="payment-container">
      <div className="payment-header"><h1>Booking not found</h1></div>
    </div>
  );

  const title = booking.movie?.title || booking.title || "Movie";
  const seats = booking.seats || [];
  const ticketPrice = Number(booking.ticketPrice || 0);
  const total = Number(booking.totalPrice || (seats.length * ticketPrice));

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Payment</h1>
        <p>Confirm your payment to complete the booking</p>
      </div>

      <div className="payment-grid">
        <div className="qr-card">
          <div className="qr-placeholder" aria-hidden="true">
            <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" className="qr-mock" role="img" aria-label="Mock QR code">
              <rect width="160" height="160" fill="#fff"/>
              {/* finder TL */}
              <rect x="6" y="6" width="32" height="32" fill="#111"/>
              <rect x="12" y="12" width="20" height="20" fill="#fff"/>
              <rect x="16" y="16" width="12" height="12" fill="#111"/>
              {/* finder TR */}
              <rect x="122" y="6" width="32" height="32" fill="#111"/>
              <rect x="128" y="12" width="20" height="20" fill="#fff"/>
              <rect x="132" y="16" width="12" height="12" fill="#111"/>
              {/* finder BL */}
              <rect x="6" y="122" width="32" height="32" fill="#111"/>
              <rect x="12" y="128" width="20" height="20" fill="#fff"/>
              <rect x="16" y="132" width="12" height="12" fill="#111"/>
              {renderQrModules()}
            </svg>
          </div>

          <div className="qr-amount outer-amount">
            <div className="qr-amount-label">Amount</div>
            <div className="qr-amount-value">฿{total.toLocaleString()}</div>
          </div>
        </div>

        <div className="payment-summary-card">
          <h2>Payment Summary</h2>

          <div className="payment-details">
            <div className="payment-row">
              <div className="payment-label">Movie</div>
              <div className="payment-value">{title}</div>
            </div>
            <div className="payment-row">
              <div className="payment-label">Showtime</div>
              <div className="payment-value">{booking.showtime}</div>
            </div>
            <div className="payment-row">
              <div className="payment-label">Seats</div>
              <div className="payment-value">{seats.join(", ")}</div>
            </div>
            <div className="payment-row">
              <div className="payment-label">Price / seat</div>
              <div className="payment-value">฿{ticketPrice.toLocaleString()}</div>
            </div>
          </div>

          <div className="payment-total">
            <div className="payment-total-row">
              <div>Total</div>
              <div className="payment-total-amount">฿{total.toLocaleString()}</div>
            </div>
          </div>

          <button className="payment-button" onClick={confirmMockPayment} disabled={processing}>
            {processing ? "Processing…" : `Confirm Payment ฿${total.toLocaleString()}`}
          </button>

          <div className="payment-note">This is a mock payment. No real transaction will occur.</div>

          {error && <div style={{marginTop:12,color:'#f87171'}}>{error}</div>}
        </div>
      </div>
    </div>
  );
}