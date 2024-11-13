'use server';

import clientPromise from '@/app/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ObjectId } from 'mongodb';

async function getSingleRoom(id) {
  try {
    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const roomsCollection = db.collection('rooms');

    // Fetch the room by ID
    const room = await roomsCollection.findOne({ _id: new ObjectId(id) });
    if (!room) {
      return { error: 'Room not found' };
    }
    room._id = room._id.toString()
    // Revalidate the cache for this path
    revalidatePath('/', 'layout');
    return room;
  } catch (error) {
    console.log('Failed to get room', error);
    redirect('/error');
  }
}

export default getSingleRoom;
