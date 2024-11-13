'use server';

import clientPromise from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import checkAuth from './checkAuth';

async function getMyRooms() {
  const sessionCookie = cookies().get('session-token'); // Use JWT-based session token
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Authenticate and get the user's information
    const { user } = await checkAuth();
    if (!user) {
      return {
        error: 'You must be logged in to view rooms',
      };
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const roomsCollection = db.collection('rooms');

    // Fetch rooms created by the authenticated user
    const rooms = await roomsCollection
      .find({ user_id: user.id.toString() })
      .toArray();

    // Map over the rooms array and convert each `_id` to a string
    const roomsWithStringId = rooms.map(room => ({
      ...room,
      _id: room._id.toString(),
    }));

    return roomsWithStringId;
  } catch (error) {
    console.log('Failed to get user rooms', error);
    redirect('/error');
  }
}

export default getMyRooms;
