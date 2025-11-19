import { mockMovies, mockBookings, mockUser } from "./mock-data"

// Simulated API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Default to the deployed backend on Render. In Vercel set `NEXT_PUBLIC_BACKEND_URL`
// to override at deploy-time. For local development, you can keep `.env.local`.
export const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "https://csi400-project.onrender.com";

export const moviesApi = {
  getAll: async () => {
    const res = await fetch(`${BACKEND_BASE}/api/movies`, { cache: "no-store" });
    if (!res.ok) {
      const txt = await res.text().catch(() => null);
      throw new Error(`moviesApi.getAll failed ${res.status}: ${txt}`);
    }
    const d = await res.json().catch(() => null);
    // accept either array or { movies: [...] }
    return Array.isArray(d) ? d : (d?.movies || []);
  },

  getById: async (id) => {
    if (!id) return null;
    const res = await fetch(`${BACKEND_BASE}/api/movies/${id}`, { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404) return null;
      if (res.status === 401) { 
        console.warn(`moviesApi.getById: 401 for id=${id}`);
        return null;
      }
      const txt = await res.text().catch(() => null);
      throw new Error(`moviesApi.getById failed ${res.status}: ${txt}`);
    }
    const d = await res.json().catch(() => null);
    return d.movie || d || null;
  },
};

// Bookings API
export const bookingsApi = {
  getAll: async () => {
    // Fetch bookings for current user from backend
    const res = await fetch(`${BACKEND_BASE}/api/bookings`, { credentials: 'include' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`bookingsApi.getAll failed ${res.status}: ${t}`);
    }
    const d = await res.json().catch(() => null);
    return d?.bookings || [];
  },

  create: async (booking) => {
    // send booking to backend for persistence
    const payload = {
      movieId: booking.movieId,
      showtime: booking.showtime,
      seats: booking.seats,
      ticketPrice: booking.ticketPrice || 0,
      totalPrice: booking.totalPrice || booking.total || 0,
      branch: booking.branch || null,
    };

    const res = await fetch(`${BACKEND_BASE}/api/bookings`, {
      credentials: 'include',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`bookingsApi.create failed ${res.status}: ${t}`);
    }
    const d = await res.json().catch(() => null);
    return d?.booking || d || null;
  },
}

// User API
export const userApi = {
  get: async () => {
    await delay(300)
    return mockUser
  },

  update: async (userData) => {
    await delay(500)
    Object.assign(mockUser, userData)
    return mockUser
  },
}

// Admin & misc API helpers (calls backend endpoints with credentials)
export const adminApi = {
  getAuditLogs: async (opts = {}) => {
    const qs = new URLSearchParams(opts).toString();
    const res = await fetch(`${BACKEND_BASE}/api/admin/auditlogs?${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  getRequests: async () => {
    const res = await fetch(`${BACKEND_BASE}/api/admin/requests`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch requests');
    return res.json();
  },

  postRequest: async (body) => {
    const res = await fetch(`${BACKEND_BASE}/api/admin/requests`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`postRequest failed ${res.status}: ${t}`);
    }
    return res.json();
  },

  getStatements: async (opts = {}) => {
    const qs = new URLSearchParams(opts).toString();
    const res = await fetch(`${BACKEND_BASE}/api/admin/statements?${qs}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch statements');
    return res.json();
  }
}

// Reviews API (public create/list)
export const reviewsApi = {
  post: async (movieId, rating, comment) => {
    const res = await fetch(`${BACKEND_BASE}/api/reviews`, { credentials: 'include', method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ movieId, rating, comment }) });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`reviewsApi.post failed ${res.status}: ${t}`);
    }
    const json = await res.json();
    // emit a client-side event so other components can refresh (MovieCard, MovieDetails)
    try {
      if (typeof window !== 'undefined') {
        const ev = new CustomEvent('reviews-changed', { detail: { movieId } });
        window.dispatchEvent(ev);
      }
    } catch (e) {
      // ignore if events aren't supported
    }
    return json;
  },

  listByMovie: async (movieId) => {
    const qs = movieId ? `?movieId=${encodeURIComponent(movieId)}` : '';
    const res = await fetch(`${BACKEND_BASE}/api/reviews${qs}`);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  }
  ,
  // fetch all movieIds the current authenticated user has reviewed
  getMyReviewedMovieIds: async () => {
    const res = await fetch(`${BACKEND_BASE}/api/reviews/mine`, { credentials: 'include' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`getMyReviewedMovieIds failed ${res.status}: ${t}`);
    }
    return res.json(); // { movieIds: [...] }
  }
};

// Requests API for regular users
export const requestsApi = {
  getMine: async () => {
    const res = await fetch(`${BACKEND_BASE}/api/admin/requests/my`, { credentials: 'include' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`requestsApi.getMine failed ${res.status}: ${t}`);
    }
    return res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${BACKEND_BASE}/api/admin/requests/${id}`, { credentials: 'include', method: 'DELETE' });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`requestsApi.delete failed ${res.status}: ${t}`);
    }
    return res.json();
  }
}

// Auth helper for frontend components to fetch current user from backend
export const authApi = {
  getMe: async () => {
    const res = await fetch(`${BACKEND_BASE}/api/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const payload = await res.json().catch(() => null);
    return payload?.user || payload || null;
  }
}

// Admin request helpers
adminApi.patchRequest = async (id, body) => {
  const res = await fetch(`${BACKEND_BASE}/api/admin/requests/${id}`, { credentials: 'include', method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`patchRequest failed ${res.status}: ${t}`);
  }
  return res.json();
};

// Convenience wrapper to create a refund request via admin requests endpoint
adminApi.requestRefund = async (bookingId, reason) => {
  return adminApi.postRequest({ type: 'refund', payload: { bookingId, reason } });
};
