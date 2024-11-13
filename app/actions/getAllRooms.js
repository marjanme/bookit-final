'use server';

import clientPromise from '@/app/lib/mongodb';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

async function getAllRooms() {
  try {
    const client = await clientPromise;
    const db = client.db('bookit'); // Use 'bookit' database

    // Fetch rooms from the MongoDB collection
    const rooms = await db.collection('rooms').find({}).toArray();

    // Revalidate the cache for this path
    revalidatePath('/', 'layout');

    return rooms;
  } catch (error) {
    console.log('Failed to get rooms', error);
    redirect('/error');
  }
}

export default getAllRooms;
