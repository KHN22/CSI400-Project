import { mockMovies, mockBookings, mockUser } from "./mock-data"

// Simulated API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const BACKEND_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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
    await delay(500)
    return mockBookings
  },

  create: async (booking) => {
    await delay(800)
    const newBooking = {
      ...booking,
      id: `booking-${Date.now()}`,
      status: "confirmed",
    }
    mockBookings.push(newBooking)
    return newBooking
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
