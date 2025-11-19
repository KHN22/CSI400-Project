"use client";
import React, { useEffect, useState } from "react";
import { bookingsApi, authApi, reviewsApi } from "@/lib/api";

export default function ReviewPanel() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState(null);

  const [activeBooking, setActiveBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewedMovies, setReviewedMovies] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true);
    try {
      const b = await bookingsApi.getAll();
      setBookings(b || []);
    } catch (e) {
      setBookings([]);
    } finally { setLoading(false); }
  }

  useEffect(() => { (async () => { try { const u = await authApi.getMe(); setMe(u); } catch(e) { setMe(null); } })(); }, []);

  // When bookings or current user changes, determine which booked movies the user already reviewed
  useEffect(() => {
    let mounted = true;
    async function checkReviewed() {
      setReviewedMovies([]);
      if (!me || !bookings || bookings.length === 0) return;
      try {
        const movieIds = Array.from(new Set(bookings.map(b => bookingMovieId(b)).filter(Boolean)));
        if (movieIds.length === 0) return;
        // single call to server to fetch movieIds reviewed by current user
        const resp = await reviewsApi.getMyReviewedMovieIds();
        const mine = resp?.movieIds || [];
        const reviewed = movieIds.filter(mid => mine.some(x => String(x) === String(mid)));
        if (mounted) setReviewedMovies(reviewed);
      } catch (e) {
        // ignore
      }
    }
    checkReviewed();
    return () => { mounted = false; }
  }, [bookings, me]);

  function bookingMovieId(b) {
    return b.movieId || b.movie?._id || b.movie?.id || b.movie || null;
  }

  async function submitReview() {
    if (!activeBooking) return alert('No booking selected');
    const movieId = bookingMovieId(activeBooking);
    if (!movieId) return alert('Cannot determine movie id for this booking');
    if (hasReviewed) return alert('You have already reviewed this movie');
    setSubmitting(true);
    try {
      await reviewsApi.post(movieId, Number(rating), comment);
      alert('Review submitted');
      setActiveBooking(null);
      setComment('');
      setRating(5);
      setHasReviewed(false);
    } catch (err) {
      alert(err.message || 'Failed to submit review');
    } finally { setSubmitting(false); }
  }

  // when an active booking is selected, check whether current user already reviewed that movie
  useEffect(() => {
    let mounted = true;
    async function check() {
      setHasReviewed(false);
      if (!activeBooking) return;
      try {
        const movieId = bookingMovieId(activeBooking);
        if (!movieId) return;
        const r = await reviewsApi.listByMovie(movieId);
        const reviews = r?.reviews || [];
        if (!mounted) return;
        // determine current user id from authApi.getMe() result (we fetched me earlier)
        if (!me) {
          // try to fetch me again
          try { const u = await authApi.getMe(); setMe(u); } catch(e) { }
        }
        const myId = me?._id || me?.id || null;
        const found = reviews.some(rv => {
          const uid = rv.userId?._id || rv.userId || null;
          return myId && uid && String(uid) === String(myId);
        });
        setHasReviewed(found);
      } catch (e) {
        // ignore
      }
    }
    check();
    return () => { mounted = false; }
  }, [activeBooking, me]);

  return (
    <div>
      <h2>Reviews</h2>
      <p>Leave a review for a movie you've booked.</p>
      {loading ? <div>Loading…</div> : (
        <div>
          {bookings.length === 0 ? <div>No bookings found</div> : (
            <ul>
              {bookings.map(b => (
                <li key={b.id || b._id} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong>{b.movieTitle || b.movie?.title || b.movie || 'Booking'}</strong>
                      <div style={{ fontSize: 12, color: '#666' }}>{b.status}</div>
                    </div>
                    <div>
                      {(() => {
                        const mid = bookingMovieId(b);
                        const already = mid && reviewedMovies.some(x => String(x) === String(mid));
                        if (already) return <div style={{ color: '#06b6d4', fontSize: 13 }}>Reviewed</div>;
                        return <button onClick={() => setActiveBooking(b)}>Leave Review</button>;
                      })()}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {activeBooking && (
            <div style={{ marginTop: 16, padding: 12, border: '1px solid #ddd', borderRadius: 6 }}>
              <h4>Review for {activeBooking.movieTitle || activeBooking.movie?.title || 'movie'}</h4>
              {hasReviewed && <div style={{ color: 'green', marginBottom: 8 }}>You have already reviewed this movie.</div>}
              <div style={{ marginBottom: 8 }}>
                <label>Rating: </label>
                <select value={rating} onChange={e => setRating(e.target.value)}>
                  {[5,4,3,2,1].map(v => <option key={v} value={v}>{v} star{v>1 ? 's' : ''}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 8 }}>
                <label>Comment:</label>
                <div>
                  <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} style={{ width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitReview} disabled={submitting || hasReviewed}>{submitting ? 'Submitting…' : 'Submit Review'}</button>
                <button onClick={() => setActiveBooking(null)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
