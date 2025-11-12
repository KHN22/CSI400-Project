"use client";

import React, { useEffect, useState } from "react";
import { BACKEND_BASE } from "@/lib/api";
import { MovieGrid } from "@/components/movie-grid";
import "../styles/home.css";

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/movies`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error("Failed to fetch movies");
        }

        const data = await res.json();
        setMovies(data.movies || []);
      } catch (err) {
        console.error("Error fetching movies:", err);
        setError("Failed to load movies");
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="home-container">
      <div className="home-header">
        <h1 className="home-title">Now Showing</h1>
        <p className="home-subtitle">Book your tickets for the latest blockbusters</p>
      </div>
      <MovieGrid movies={movies} />
    </div>
  );
}
