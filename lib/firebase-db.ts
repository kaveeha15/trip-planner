"use client"

import { getFirebaseDb } from "./firebase"
import { getCurrentUser } from "./firebase-auth"

// Trip types
export type TripType = "holiday" | "religious" | "business" | "adventure" | "cultural"

export interface Location {
  placeId: string
  name: string
  address: string
  lat: number
  lng: number
}

export interface Trip {
  id?: string
  userId: string
  name: string
  startLocation: Location
  endLocation: Location
  startDate: Date
  endDate: Date
  days: number
  tripType: TripType
  itinerary: DayPlan[]
  createdAt: any // Using any for Timestamp to avoid import issues
}

export interface DayPlan {
  day: number
  activities: Activity[]
}

export interface Activity {
  time: string
  description: string
  location?: Location
  notes?: string
}

// Save a new trip
export const saveTrip = async (trip: Omit<Trip, "id" | "userId" | "createdAt">, uid: any) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const db = await getFirebaseDb()
  const { collection, addDoc, Timestamp } = await import("firebase/firestore")

  const tripData: Omit<Trip, "id"> = {
    ...trip,
    userId: user.uid,
    createdAt: Timestamp.now(),
  }

  const docRef = await addDoc(collection(db, "trips"), tripData)
  return { id: docRef.id, ...tripData }
}

// Get all trips for current user
export const getUserTrips = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const db = await getFirebaseDb()
  const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")

  const tripsQuery = query(collection(db, "trips"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))

  const snapshot = await getDocs(tripsQuery)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Trip[]
}

// Get a specific trip
export const getTrip = async (tripId: string) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const db = await getFirebaseDb()
  const { doc, getDoc } = await import("firebase/firestore")

  const tripDoc = await getDoc(doc(db, "trips", tripId))

  if (!tripDoc.exists()) throw new Error("Trip not found")

  const tripData = tripDoc.data() as Omit<Trip, "id">

  // Verify the trip belongs to the current user
  if (tripData.userId !== user.uid) throw new Error("Unauthorized access to trip")

  return { id: tripDoc.id, ...tripData } as Trip
}

