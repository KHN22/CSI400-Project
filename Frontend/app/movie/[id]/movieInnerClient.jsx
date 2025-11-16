"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import MovieDetails from "@/components/movie-details";
import { BACKEND_BASE } from "@/lib/api";

export default function MovieInnerClient() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const paramId = params?.id ? String(params.id) : null;
  const lastMovieId = typeof window !== "undefined" ? sessionStorage.getItem("lastMovieId") : null;
  const id = paramId === "undefined" ? lastMovieId : paramId;

  const showtime = searchParams?.get("showtime") || "";
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      if (!id) {
        console.warn("[MoviePage] No movie ID found, redirecting to home");
        router.replace("/");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_BASE}/api/movies/${id}`, {
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Movie not found");
          }
          const errorText = await res.text().catch(() => null);
          throw new Error(
            errorText ? JSON.parse(errorText)?.message : `Failed to load movie (${res.status})`
          );
        }

        const data = await res.json();
        if (!mounted) return;

        setMovie(data.movie || data);

        if (paramId === "undefined" && lastMovieId) {
          router.replace(`/movie/${lastMovieId}${showtime ? `?showtime=${showtime}` : ""}`);
        }
      } catch (err) {
        console.error("[MoviePage] Error:", err);
        if (mounted) {
          setError(err.message || String(err));
          setMovie(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      mounted = false;
    };
  }, [id, paramId, lastMovieId, showtime, router]);

  if (!id || id === "undefined") return null;

  if (loading) {
    return (
      <div className="movie-loading">
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          Loading movie details...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="movie-error">
        <div
          className="card"
          style={{
            color: "#ef4444",
            textAlign: "center",
            padding: "2rem",
            maxWidth: "400px",
            margin: "0 auto",
          }}
        >
          <div style={{ marginBottom: "1rem" }}>{error}</div>
          <button
            onClick={() => router.push("/")}
            style={{
              padding: "0.5rem 1rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="movie-not-found">
        <div className="card" style={{ textAlign: "center", padding: "2rem" }}>
          Movie not found
        </div>
      </div>
    );
  }

  return <MovieDetails movie={movie} selectedShowtime={showtime} />;
}
