"use client";
import React, { useEffect, useState } from "react";
import { bookingsApi, authApi, adminApi, requestsApi } from "@/lib/api";
import '../styles/refund-panel.css';

// Refund window: minutes before showtime when refunds close
const REFUND_WINDOW_MINUTES = 60;

export default function RefundPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  const [activeBooking, setActiveBooking] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const b = await bookingsApi.getAll();
      setBookings(b || []);
      // also load user's own requests so we can disable duplicate submissions
      try {
        const my = await requestsApi.getMine();
        setMyRequests(my.requests || []);
      } catch (e) {
        setMyRequests([]);
      }
    } catch (e) {
      setBookings([]);
    } finally { setLoading(false); }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await authApi.getMe();
        if (mounted) setMe(u);
      } catch (e) {
        if (mounted) setMe(null);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Live countdown: update `now` every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  function bookingId(b) { return b.id || b._id; }

  async function submitRefundRequest() {
    if (!activeBooking) return alert('No booking selected');
    const bid = bookingId(activeBooking);
    if (!bid) return alert('Cannot determine booking id');
    // Check refund deadline
    const deadline = computeRefundDeadline(activeBooking);
    if (deadline && (now > deadline.getTime())) return alert('Refund time window has expired for this booking');
    setSubmitting(true);
    try {
      await adminApi.requestRefund(bid, reason || '');
      alert('Refund request submitted');
      setActiveBooking(null);
      setReason('');
      // refresh bookings and requests
      await load();
    } catch (err) {
      alert(err.message || 'Failed to submit refund request');
    } finally { setSubmitting(false); }
  }

  async function cancelRequestForBooking(booking) {
    const bid = bookingId(booking);
    const req = myRequests.find(r => r.type === 'refund' && String(r.payload?.bookingId) === String(bid) && r.status === 'pending');
    if (!req) return alert('No pending refund request for this booking');
    try {
      await requestsApi.delete(req._id);
      alert('Refund request cancelled');
      await load();
    } catch (e) {
      alert(e.message || 'Failed to cancel request');
    }
  }

  return (
    <div className="refund-panel">
      <h2>Refunds</h2>
      <p>Request a refund for a booking. Admins will review requests in the Requests panel.</p>
      {loading ? <div>Loading…</div> : (
        <div>
          {bookings.length === 0 ? <div>No bookings found</div> : (
            <ul>
              {bookings.map(b => (
                <li key={bookingId(b)} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{b.movieTitle || b.movie?.title || b.movie || 'Booking'}</strong>
                      <div style={{ fontSize: 12, color: '#666' }}>{b.status}</div>
                      {renderRefundInfo(b, now)}
                    </div>
                    <div>
                      {myRequests && myRequests.find(r => r.type === 'refund' && String(r.payload?.bookingId) === String(bookingId(b)) && r.status === 'pending') ? (
                        <>
                          <button onClick={() => cancelRequestForBooking(b)}>Cancel Refund Request</button>
                        </>
                      ) : (
                        <button onClick={() => setActiveBooking(b)} disabled={isRefundExpired(b, now)}>{isRefundExpired(b, now) ? 'Refund Closed' : 'Request Refund'}</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeBooking && (
            <div className="refund-panel-active">
              <h4>Refund request for {activeBooking.movieTitle || activeBooking.movie?.title || 'booking'}</h4>
              {renderRefundInfo(activeBooking, now)}
              <div style={{ marginBottom: 8 }}>
                <label>Reason (optional)</label>
                <div>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitRefundRequest} disabled={submitting || isRefundExpired(activeBooking, now)}>{submitting ? 'Submitting…' : 'Submit Refund Request'}</button>
                <button onClick={() => setActiveBooking(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function parseShowtime(booking) {
  // booking may have separate date and showtime (mock-data), or showtime as ISO
  try {
    if (booking.date && booking.showtime) {
      // Try: '2025-10-15' + '8:30 PM' -> '2025-10-15 20:30'
      const dt = new Date(`${booking.date} ${booking.showtime}`);
      if (!isNaN(dt.getTime())) return dt;
    }
    // if booking.showtime looks like ISO
    if (booking.showtime) {
      const dt = new Date(booking.showtime);
      if (!isNaN(dt.getTime())) return dt;
    }
    // fallback to createdAt
    if (booking.createdAt) {
      const dt = new Date(booking.createdAt);
      if (!isNaN(dt.getTime())) return dt;
    }
  } catch (e) {}
  return null;
}

function computeRefundDeadline(booking) {
  const showDt = parseShowtime(booking);
  if (!showDt) return null;
  const ms = REFUND_WINDOW_MINUTES * 60 * 1000;
  return new Date(showDt.getTime() - ms);
}

function isRefundExpired(booking, now = Date.now()) {
  const dl = computeRefundDeadline(booking);
  if (!dl) return false; // if unknown showtime, allow refund (or handle separately)
  return now > dl.getTime();
}

function formatTimeLeft(ms) {
  if (ms <= 0) return '0s';
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / (1000 * 60)) % 60;
  const hrs = Math.floor(ms / (1000 * 60 * 60)) % 24;
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  let parts = [];
  if (days) parts.push(`${days}d`);
  if (hrs) parts.push(`${hrs}h`);
  if (min) parts.push(`${min}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

function renderRefundInfo(booking, now = Date.now()) {
  const showDt = parseShowtime(booking);
  const dl = computeRefundDeadline(booking);
  if (!showDt) return <div style={{ fontSize: 12, color: '#94a3b8' }}>Showtime: unknown</div>;
  const nowVal = now;
  const timeToDeadline = dl ? dl.getTime() - nowVal : null;
  return (
    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
      <div>Showtime: {showDt.toLocaleString()}</div>
      {dl ? (
        timeToDeadline > 0 ? (
          <div>Refund available for: {formatTimeLeft(timeToDeadline)}</div>
        ) : (
          <div style={{ color: '#f87171' }}>Refund window closed</div>
        )
      ) : (
        <div>Refund policy: contact support</div>
      )}
    </div>
  );
}
