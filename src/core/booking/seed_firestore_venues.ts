import { initializeApp, applicationDefault, getApps, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
/// This script seeds the Firestore database with initial venue data for testing and development purposes.
// Initialize Firebase Admin SDK
const app = getApps().length
    ? getApp()
    : initializeApp({ credential: applicationDefault() });
const db = getFirestore(app);

const venues = [
  {
    id: 'PF34hxfAJ4HUsvB8seYn',
    name: 'Ping Pong Court @ Wisma Commerce dot com',
    address: 'Wisma Commerce Dot Com',
    description: 'Mini Ping Pong Court at Wisma Commerce Dot Com level 3',
    pricePerHour: 10,
    type: 'Ping Pong Court',
    tags: ['ping pong', 'court','table','tennis'],
    photos: [
      'https://sportsmark.net/wp-content/uploads/2023/03/How-To-Set-Up-A-Badminton-Court-1183x591.jpg',
    ],
    rules: 'No littering. Follow event guidelines.',
  },
  {
    id: 'ErZXWMzQdN1ILj8Cs3Yh',
    name: 'Futsal Court @ Wisma Commerce dot com',
    address: 'Wisma Commerce Dot Com',
    description: 'Mini Futsal Court at Wisma Commerce Dot Com level 3',
    pricePerHour: 10,
    type: 'Futsal Court',
    tags: ['futsal', 'court'],
    photos: [
      'https://sportsmark.net/wp-content/uploads/2023/03/How-To-Set-Up-A-Badminton-Court-1183x591.jpg',
    ],
    rules: 'No littering. Follow event guidelines.',
  },
  {
    id: 'JwAKlCjdLZsBb6zAQG6n',
    name: 'Badminton Court 1 @ Wisma Commerce dot com',
    address: 'Wisma Commerce Dot Com',
    description: 'Mini Badminton Court at Wisma Commerce Dot Com level 3',
    pricePerHour: 10,
    type: 'Badminton Court',
    tags: ['badminton', 'court'],
    photos: [
      'https://sportsmark.net/wp-content/uploads/2023/03/How-To-Set-Up-A-Badminton-Court-1183x591.jpg',
    ],
    rules: 'No littering. Follow event guidelines.',
  },
  {
    id: 'XRX4Pn4b5uk1TZ80PFjO',
    name: 'Badminton Court 2 @ Wisma Commerce dot com',
    address: 'Wisma Commerce Dot Com',
    description: 'Mini Badminton Court at Wisma Commerce Dot Com level 3',
    pricePerHour: 10,
    type: 'Badminton Court',
    tags: ['badminton', 'court'],
    photos: [
      'https://sportsmark.net/wp-content/uploads/2023/03/How-To-Set-Up-A-Badminton-Court-1183x591.jpg',
    ],
    rules: 'No littering. Follow event guidelines.',
  },
  // Add more venues here if needed
];

export async function seedVenues() {
  for (const venue of venues) {
    await db.collection('venues').doc(venue.id).set(venue);
    console.log(`Seeded venue: ${venue.name}`);
  }
  console.log('Seeding complete.');
}

seedVenues().catch(console.error);
