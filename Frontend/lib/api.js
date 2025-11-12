import { mockMovies, mockBookings, mockUser } from "./mock-data"

// Simulated API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

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

// ตัวอย่างฟังก์ชันสำหรับ Fetch API
export async function fetchBookings() {
  const res = await fetch(`${BACKEND_BASE}/api/bookings`, {
    method: 'GET',
    credentials: 'include', // สำคัญ: ส่ง Cookies ไปกับ Request
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return await res.json();
}

export async function fetchLogin(email, password) {
  const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
    method: 'POST',
    credentials: 'include', // สำคัญ: ส่ง Cookies ไปกับ Request
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Failed to login');
  }

  return await res.json();
}

export async function fetchBookingsWithToken(token) {
  const res = await fetch(`${BACKEND_BASE}/api/bookings`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // ส่ง Bearer Token
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch bookings');
  }

  return await res.json();
}

export async function fetchUserProfile() {
  const res = await fetch(`${BACKEND_BASE}/api/auth/profile`, {
    method: 'GET',
    credentials: 'include', // สำคัญ: ส่ง Cookies ไปกับ Request
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return await res.json();
}
