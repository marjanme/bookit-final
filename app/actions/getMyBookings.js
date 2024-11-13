'use server';

import clientPromise from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';

async function getMyBookings() {
  const sessionCookie = cookies().get('session-token'); // Use JWT-based session token
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Authenticate and get the user's information
    const { user } = await checkAuth();
    if (!user) {
      return {
        error: 'You must be logged in to view bookings',
      };
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const bookingsCollection = db.collection('bookings');

    // Fetch bookings for the authenticated user
    const bookings = await bookingsCollection
      .find({ user_id: user.id })
      .toArray();

      const bookingsWithStringId = bookings.map(booking => ({
        ...booking,
        _id: booking._id.toString(),
      }));
    return bookingsWithStringId;

  } catch (error) {
    console.log('Failed to get user bookings', error);
    return {
      error: 'Failed to get bookings',
    };
  }
}

export default getMyBookings;
