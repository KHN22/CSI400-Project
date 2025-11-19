// migrate-reviews.js
// Moves current reviews to `legacy_reviews` collection and updates Movie.rating from TMDB when tmdbId exists.

require('dotenv').config();
const mongoose = require('mongoose');

const Review = require('../models/Review');
const Movie = require('../models/Movie');

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  try {
    // 1) copy reviews to legacy_reviews
    const db = mongoose.connection.db;
    const reviews = await db.collection('reviews').find({}).toArray();
    console.log('Found', reviews.length, 'reviews to archive');
    if (reviews.length > 0) {
      const legacy = db.collection('legacy_reviews');
      // add migratedAt metadata
      const docs = reviews.map(r => ({ ...r, migratedAt: new Date() }));
      await legacy.insertMany(docs, { ordered: false });
      // delete originals
      const ids = reviews.map(r => r._id);
      await db.collection('reviews').deleteMany({ _id: { $in: ids } });
      console.log('Archived and removed legacy reviews');
    } else {
      console.log('No reviews found to archive');
    }

    // 2) update Movie.rating from TMDB when available
    // load all movies
    const movies = await Movie.find({}).lean();
    console.log('Processing', movies.length, 'movies for TMDB rating update');

    const fetchTmdb = async (tmdbId) => {
      try {
        const key = process.env.TMDB_API_KEY;
        if (!key) return null;
        const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(tmdbId)}?api_key=${encodeURIComponent(key)}&language=en-US`;
        const https = require('https');
        return await new Promise((resolve, reject) => {
          https.get(url, (r) => {
            const chunks = [];
            r.on('data', c => chunks.push(c));
            r.on('end', () => {
              try {
                const body = Buffer.concat(chunks).toString('utf8');
                if (r.statusCode < 200 || r.statusCode >= 300) return resolve(null);
                const data = JSON.parse(body);
                resolve(data);
              } catch (e) { resolve(null); }
            });
          }).on('error', () => resolve(null));
        });
      } catch (e) { return null; }
    };

    let updatedCount = 0;
    for (const m of movies) {
      if (m.tmdbId) {
        const md = await fetchTmdb(m.tmdbId);
        if (md && typeof md.vote_average !== 'undefined') {
          const rating = Number((Math.round((md.vote_average || 0) * 10) / 10).toFixed(1));
          await Movie.findByIdAndUpdate(m._id, { rating });
          updatedCount++;
          console.log('Updated', m._id, 'rating ->', rating);
        }
      }
    }
    console.log('Updated ratings for', updatedCount, 'movies');

    console.log('Migration completed. Please restart the backend server.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
