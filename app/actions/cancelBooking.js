'use server';

import clientPromise from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import checkAuth from './checkAuth';
import { ObjectId } from 'mongodb';

async function cancelBooking(bookingId) {
  const sessionCookie = cookies().get('session-token'); // Use JWT-based session token
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Authenticate and get the user's information
    const { user } = await checkAuth();
    if (!user) {
      return {
        error: 'You must be logged in to cancel a booking',
      };
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const bookingsCollection = db.collection('bookings');

    // Find the booking in MongoDB
    const booking = await bookingsCollection.findOne({ _id: ObjectId.createFromHexString(bookingId) });
    if (!booking) {
      return {
        error: 'Booking not found',
      };
    }

    // Check if the booking belongs to the current user
    if (booking.user_id !== user.id) {
      return {
        error: 'You are not authorized to cancel this booking',
      };
    }

    // Delete the booking
    await bookingsCollection.deleteOne({ _id: ObjectId.createFromHexString(bookingId) });

    // Revalidate cache to reflect changes on the bookings page
    revalidatePath('/bookings', 'layout');

    return {
      success: true,
    };
  } catch (error) {
    console.log('Failed to cancel booking', error);
    return {
      error: 'Failed to cancel booking',
    };
  }
}

export default cancelBooking;
