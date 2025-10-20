export const mockMovies = [
  {
    id: "1",
    title: "Quantum Paradox",
    poster: "/sci-fi-movie-poster-quantum.jpg",
    rating: 8.5,
    genre: "Sci-Fi, Thriller",
    duration: "2h 28m",
    description:
      "A brilliant physicist discovers a way to manipulate time, but each change creates devastating consequences across multiple realities.",
    showtimes: ["10:00 AM", "1:30 PM", "5:00 PM", "8:30 PM"],
  },
  {
    id: "2",
    title: "Midnight Chronicles",
    poster: "/dark-fantasy-movie-poster.jpg",
    rating: 7.8,
    genre: "Fantasy, Adventure",
    duration: "2h 15m",
    description:
      "In a world where darkness reigns, a young warrior must unite ancient clans to restore light to the realm.",
    showtimes: ["11:00 AM", "2:30 PM", "6:00 PM", "9:30 PM"],
  },
  {
    id: "3",
    title: "The Last Horizon",
    poster: "/action-adventure-movie-poster.jpg",
    rating: 8.2,
    genre: "Action, Drama",
    duration: "2h 42m",
    description:
      "A retired soldier is forced back into action when a global threat emerges from the depths of the ocean.",
    showtimes: ["10:30 AM", "2:00 PM", "5:30 PM", "9:00 PM"],
  },
  {
    id: "4",
    title: "Echoes of Tomorrow",
    poster: "/futuristic-movie-poster.png",
    rating: 7.5,
    genre: "Sci-Fi, Mystery",
    duration: "2h 05m",
    description:
      "A detective in a dystopian future must solve a series of murders that seem to predict events before they happen.",
    showtimes: ["11:30 AM", "3:00 PM", "6:30 PM", "10:00 PM"],
  },
  {
    id: "5",
    title: "Crimson Sky",
    poster: "/war-drama-movie-poster.jpg",
    rating: 8.9,
    genre: "War, Drama",
    duration: "2h 35m",
    description:
      "Based on true events, this epic tale follows a squadron of pilots during the most dangerous mission of WWII.",
    showtimes: ["10:00 AM", "1:45 PM", "5:15 PM", "8:45 PM"],
  },
  {
    id: "6",
    title: "Neon Dreams",
    poster: "/cyberpunk-movie-poster.png",
    rating: 7.9,
    genre: "Sci-Fi, Romance",
    duration: "1h 58m",
    description:
      "In a neon-lit megacity, a hacker falls in love with an AI, challenging the boundaries between human and machine.",
    showtimes: ["12:00 PM", "3:30 PM", "7:00 PM", "10:30 PM"],
  },
]

export const mockUser = {
  id: "user-1",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  phone: "+1 (555) 123-4567",
  profilePicture: "/professional-profile.png",
}

export const mockBookings = [
  {
    id: "booking-1",
    movieId: "1",
    movieTitle: "Quantum Paradox",
    date: "2025-10-15",
    showtime: "8:30 PM",
    seats: ["E5", "E6"],
    total: 28.0,
    status: "confirmed",
  },
  {
    id: "booking-2",
    movieId: "5",
    movieTitle: "Crimson Sky",
    date: "2025-10-08",
    showtime: "5:15 PM",
    seats: ["F7", "F8", "F9"],
    total: 42.0,
    status: "confirmed",
  },
]

// Seat configuration
export const SEAT_ROWS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
export const SEAT_COLUMNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const SEAT_PRICE = 14.0

// Mock booked seats (would come from API in real app)
export const getBookedSeats = (movieId, showtime) => {
  // Simulate some pre-booked seats
  return ["A1", "A2", "B5", "C3", "C4", "D7", "E8", "F1", "F2", "F3"]
}
