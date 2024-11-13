'use server';

import clientPromise from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DateTime } from 'luxon';

// Convert a date string to a Luxon DateTime object in UTC
function toUTCDateTime(dateString) {
  return DateTime.fromISO(dateString, { zone: 'utc' }).toUTC();
}

// Check for overlapping date ranges
function dateRangesOverlap(checkInA, checkOutA, checkInB, checkOutB) {
  return checkInA < checkOutB && checkOutA > checkInB;
}

async function checkRoomAvailability(roomId, checkIn, checkOut) {
  const sessionCookie = cookies().get('session-token');
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    const client = await clientPromise;
    const db = client.db('bookit');
    const bookingsCollection = db.collection('bookings');

    const checkInDateTime = toUTCDateTime(checkIn);
    const checkOutDateTime = toUTCDateTime(checkOut);

    // Fetch all bookings for the given room from MongoDB
    const bookings = await bookingsCollection
      .find({ room_id: roomId })
      .toArray();

    // Loop over bookings and check for overlaps
    for (const booking of bookings) {
      const bookingCheckInDateTime = toUTCDateTime(booking.check_in);
      const bookingCheckOutDateTime = toUTCDateTime(booking.check_out);

      if (
        dateRangesOverlap(
          checkInDateTime,
          checkOutDateTime,
          bookingCheckInDateTime,
          bookingCheckOutDateTime
        )
      ) {
        return false; // Overlap found, do not book
      }
    }

    // No overlap found, continue to book
    return true;
  } catch (error) {
    console.log('Failed to check availability', error);
    return {
      error: 'Failed to check availability',
    };
  }
}

export default checkRoomAvailability;
