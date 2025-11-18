#!/usr/bin/env node
/**
 * Simple migration to add `branch` fields to Users, Movies and Bookings.
 * Assigns branches A/B/C round-robin for existing users/movies/bookings if missing.
 * Run with: node ./scripts/migrate-add-branches.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Booking = require('../models/Booking');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const branches = ['A','B','C'];

  try {
    // Users
    const users = await User.find();
    let i = 0;
    for (const u of users) {
      if (!u.branch && (u.role === 'Manager' || u.role === 'Staff')) {
        u.branch = branches[i % branches.length];
        i++;
        await u.save();
        console.log('Assigned branch', u.branch, 'to user', u.email);
      }
    }

    // Movies
    const movies = await Movie.find();
    i = 0;
    for (const m of movies) {
      if (!m.branch) {
        m.branch = branches[i % branches.length];
        i++;
        await m.save();
        console.log('Assigned branch', m.branch, 'to movie', m.title);
      }
    }

    // Bookings
    const bookings = await Booking.find();
    i = 0;
    for (const b of bookings) {
      if (!b.branch) {
        b.branch = branches[i % branches.length];
        i++;
        await b.save();
        console.log('Assigned branch', b.branch, 'to booking', b._id);
      }
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration error', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
