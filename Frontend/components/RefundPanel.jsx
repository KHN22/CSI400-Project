"use client";
import React, { useEffect, useState } from "react";
import { bookingsApi, authApi, adminApi, requestsApi } from "@/lib/api";
import '../styles/refund-panel.css';

export default function RefundPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  const [activeBooking, setActiveBooking] = useState(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => { (async () => { try { const u = await authApi.getMe(); setMe(u); } catch(e) { setMe(null); } })(); }, []);

  function bookingId(b) { return b.id || b._id; }

  async function submitRefundRequest() {
    if (!activeBooking) return alert('No booking selected');
    const bid = bookingId(activeBooking);
    if (!bid) return alert('Cannot determine booking id');
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
    <div>
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
                    </div>
                    <div>
                      {myRequests && myRequests.find(r => r.type === 'refund' && String(r.payload?.bookingId) === String(bookingId(b)) && r.status === 'pending') ? (
                        <>
                          <button onClick={() => cancelRequestForBooking(b)}>Cancel Refund Request</button>
                        </>
                      ) : (
                        <button onClick={() => setActiveBooking(b)}>Request Refund</button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeBooking && (
            <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
              <h4>Refund request for {activeBooking.movieTitle || activeBooking.movie?.title || 'booking'}</h4>
              <div style={{ marginBottom: 8 }}>
                <label>Reason (optional)</label>
                <div>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} rows={4} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitRefundRequest} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit Refund Request'}</button>
                <button onClick={() => setActiveBooking(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
