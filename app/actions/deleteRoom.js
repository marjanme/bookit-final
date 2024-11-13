'use server';

import clientPromise from '@/app/lib/mongodb';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import checkAuth from './checkAuth';
import { ObjectId } from 'mongodb';

async function deleteRoom(roomId) {
  const sessionCookie = cookies().get('session-token'); // Use JWT-based session token
  if (!sessionCookie) {
    redirect('/login');
  }

  try {
    // Authenticate and get the user's information
    const { user } = await checkAuth();
    if (!user) {
      return {
        error: 'You must be logged in to delete a room',
      };
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const roomsCollection = db.collection('rooms');

    // Fetch the room to check ownership
    const room = await roomsCollection.findOne({ _id: new ObjectId(roomId) });
    if (!room) {
      return {
        error: 'Room not found',
      };
    }

    // Verify that the room belongs to the current user
    if (room.user_id !== user.id.toString()) {
      return {
        error: 'You are not authorized to delete this room',
      };
    }

    // Delete the room from MongoDB
    await roomsCollection.deleteOne({ _id: new ObjectId(roomId) });

    // Revalidate paths to update cache
    revalidatePath('/rooms/my', 'layout');
    revalidatePath('/', 'layout');

    return {
      success: true,
    };
  } catch (error) {
    console.log('Failed to delete room', error);
    return {
      error: 'Failed to delete room',
    };
  }
}

export default deleteRoom;
