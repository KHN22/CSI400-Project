import { mockMovies, mockBookings, mockUser } from "./mock-data"

// Simulated API delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Movies API
export const moviesApi = {
  getAll: async () => {
    await delay(500)
    return mockMovies
  },

  getById: async (id) => {
    await delay(300)
    return mockMovies.find((movie) => movie.id === id)
  },
}

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
