'use server';

import clientPromise from '@/app/lib/mongodb';
import checkAuth from './checkAuth';
import { revalidatePath } from 'next/cache';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';


// Configure Cloudinary with credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


async function uploadImage(image) {
  try {
    const buffer = await image.arrayBuffer(); // Read file data as an ArrayBuffer
    const readableStream = new Readable();
    readableStream._read = () => {}; // No-op
    readableStream.push(Buffer.from(buffer));
    readableStream.push(null); // End of stream

    // Wrap Cloudinary upload_stream in a Promise
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'rooms' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      readableStream.pipe(uploadStream);
    });

    return result.secure_url; // This is the URL to store in MongoDB
    
  } catch (error) {
    console.error('Image upload error:', error);
    throw new Error('Image upload failed');
  }
}




async function createRoom(previousState, formData) {
  try {
    const { user } = await checkAuth();

    if (!user) {
      return {
        error: 'You must be logged in to create a room',
      };
    }

    // Uploading image
    let imageURL;

    const image = formData.get('image');

    if (image && image.size > 0 && image.name !== 'undefined') {
      try {
        // Upload and get URL
        imageURL = await uploadImage(image);
      } catch (error) {
        console.log('Error uploading image', error);
        return {
          error: 'Error uploading image',
        };
      }
    } else {
      console.log('No image file provided or file is invalid');
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db('bookit');
    const roomsCollection = db.collection('rooms');

    // Create room document in MongoDB
    const roomData = {
      user_id: user.id.toString(),
      name: formData.get('name'),
      description: formData.get('description'),
      sqft: parseFloat(formData.get('sqft')),
      capacity: parseInt(formData.get('capacity')),
      location: formData.get('location'),
      address: formData.get('address'),
      availability: formData.get('availability'),
      price_per_hour: parseFloat(formData.get('price_per_hour')),
      amenities: formData.get('amenities'),
      image: imageURL,
      createdAt: new Date(),
    };

    const newRoom = await roomsCollection.insertOne(roomData);

    // Revalidate cache
    revalidatePath('/', 'layout');
    return {
      success: true,
      roomId: newRoom.insertedId.toString(),
    };
  } catch (error) {
    console.log('Error creating room', error);
    const errorMessage = error.message || 'An unexpected error has occurred';
    return {
      error: errorMessage,
    };
  }
}

export default createRoom;
