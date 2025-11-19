#!/usr/bin/env node
/**
 * Migration script: backfill Booking.refunded/refunder/refundedAt
 * from AuditLog entries with action === 'REFUND'.
 *
 * Usage:
 *   MONGODB_URI="mongodb://..." node scripts/migrate-refunds.js
 */

const mongoose = require('mongoose');
const path = require('path');

// adjust require paths relative to this script
const root = path.join(__dirname, '..');
const Booking = require(path.join(root, 'models', 'Booking'));
const AuditLog = require(path.join(root, 'models', 'AuditLog'));

async function main() {
  const mongo = process.env.MONGODB_URI || 'mongodb+srv://khingza002_db_user:hloMsNw8fZBzkAvr@cluster0.udzkhhy.mongodb.net/your_db_name?retryWrites=true&w=majority';
  console.log('[migrate-refunds] Connecting to', mongo);
  await mongoose.connect(mongo, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    // find refund audit logs that reference a booking
    const logs = await AuditLog.find({ action: 'REFUND', bookingId: { $exists: true } }).sort({ timestamp: 1 });
    console.log(`[migrate-refunds] Found ${logs.length} REFUND audit logs`);

    let updated = 0;
    for (const log of logs) {
      try {
        const bid = log.bookingId;
        if (!bid) continue;
        const booking = await Booking.findById(bid);
        if (!booking) continue;
        // skip if already marked refunded
        if (booking.refunded) continue;

        booking.refunded = true;
        booking.refunder = log.actorId || booking.refunder;
        booking.refundedAt = log.timestamp || new Date();
        await booking.save();
        updated++;
        console.log(`[migrate-refunds] Marked booking ${booking._id} refunded (refunder=${String(booking.refunder)})`);
      } catch (e) {
        console.warn('[migrate-refunds] Failed to process log', log._id, e.message || e);
      }
    }

    console.log(`[migrate-refunds] Completed. Updated ${updated} bookings.`);
  } catch (err) {
    console.error('[migrate-refunds] Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
