"use client"

// This file implements a lazy-loading singleton pattern for Firebase

let app: any
let auth: any
let db: any
let firebaseInitialized = false

// Function to initialize Firebase lazily
export async function initializeFirebase() {
  if (firebaseInitialized) {
    return { app, auth, db }
  }

  try {
    // Dynamically import Firebase modules
    const { initializeApp } = await import("firebase/app")
    const { getAuth } = await import("firebase/auth")
    const { getFirestore } = await import("firebase/firestore")

    // Firebase configuration
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    // Initialize Firebase
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)

    firebaseInitialized = true

    return { app, auth, db }
  } catch (error) {
    console.error("Error initializing Firebase:", error)
    throw error
  }
}

// Helper functions to get Firebase instances
export async function getFirebaseAuth() {
  const { auth } = await initializeFirebase()
  return auth
}

export async function getFirebaseDb() {
  const { db } = await initializeFirebase()
  return db
}

