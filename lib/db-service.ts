"use client"

import firebaseConfig from "./firebase-config"
import { authService } from "./auth-service"

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
  startDate: Date | any // Accept Date or Firestore Timestamp
  endDate: Date | any   // Accept Date or Firestore Timestamp
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

// Create a simple database service
class DbService {
  private static instance: DbService
  private db: any = null
  private app: any = null
  private firebaseInitialized = false
  private initializationPromise: Promise<void> | null = null

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService()
    }
    return DbService.instance
  }

  private async initializeFirebase(): Promise<void> {
    // If already initialized, return
    if (this.firebaseInitialized) return

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Create a new initialization promise
    this.initializationPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // Import Firebase modules - IMPORTANT: Import everything upfront
        const firebase = await import("firebase/app")

        // Check if Firebase app already exists to prevent duplicate initialization
        if (!this.app) {
          // Get existing app or initialize a new one
          try {
            this.app = firebase.getApp()
          } catch (e) {
            this.app = firebase.initializeApp(firebaseConfig)
            // Add a small delay to ensure app registration is complete
            await new Promise((resolve) => setTimeout(resolve, 100))
          }
        }

        // Now import firestore
        const { getFirestore } = await import("firebase/firestore")

        // Initialize firestore
        this.db = getFirestore(this.app)

        this.firebaseInitialized = true
        resolve()
      } catch (error) {
        console.error("Error initializing Firebase:", error)
        reject(error)
      }
    })

    return this.initializationPromise
  }

  // Update the saveTrip method to better handle dates and provide more detailed error logging

  public async saveTrip(trip: Omit<Trip, "id" | "userId" | "createdAt">) {
    await this.initializeFirebase()

    const user = authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    try {
      const { collection, addDoc, Timestamp } = await import("firebase/firestore")

      // Convert JavaScript Date objects to Firestore Timestamps
      const tripData: Omit<Trip, "id"> = {
        ...trip,
        userId: user.uid,
        createdAt: Timestamp.now(),
        // Ensure dates are properly converted to Firestore Timestamps
        startDate: Timestamp.fromDate(new Date(trip.startDate)),
        endDate: Timestamp.fromDate(new Date(trip.endDate)),
      }

      console.log("Saving trip data:", JSON.stringify(tripData, null, 2))

      const docRef = await addDoc(collection(this.db, "trips"), tripData)
      console.log("Trip saved successfully with ID:", docRef.id)
      return { id: docRef.id, ...tripData }
    } catch (error) {
      console.error("Error saving trip:", error)
      throw error
    }
  }

  // Update the getUserTrips method to handle the Firestore index requirement

  public async getUserTrips() {
    await this.initializeFirebase()

    const user = authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore")

      // Simpler query that doesn't require a composite index
      // Just filter by userId without ordering
      const tripsQuery = query(collection(this.db, "trips"), where("userId", "==", user.uid))

      console.log("Fetching trips for user:", user.uid)
      const snapshot = await getDocs(tripsQuery)
      console.log(`Found ${snapshot.docs.length} trips`)

      // Get all trips and sort them in memory instead
      const trips = snapshot.docs.map((doc) => {
        const data = doc.data()

        // Convert Firestore Timestamps back to JavaScript Date objects
        return {
          id: doc.id,
          ...data,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
        }
      }) as Trip[]

      // Sort trips by createdAt in descending order (newest first)
      return trips.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt)
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
    } catch (error) {
      console.error("Error fetching trips:", error)
      // Return empty array instead of throwing to prevent UI errors
      return []
    }
  }

  public async getTrip(tripId: string) {
    await this.initializeFirebase()

    const user = authService.getCurrentUser()
    if (!user) throw new Error("User not authenticated")

    const { doc, getDoc } = await import("firebase/firestore")

    const tripDoc = await getDoc(doc(this.db, "trips", tripId))

    if (!tripDoc.exists()) throw new Error("Trip not found")

    const tripData = tripDoc.data() as Omit<Trip, "id">

    // Verify the trip belongs to the current user
    if (tripData.userId !== user.uid) throw new Error("Unauthorized access to trip")

    return { id: tripDoc.id, ...tripData } as Trip
  }
}

// Export the database service instance
export const dbService = DbService.getInstance()
