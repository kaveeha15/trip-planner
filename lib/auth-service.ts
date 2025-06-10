"use client"

import { useState, useEffect } from "react"
import firebaseConfig from "./firebase-config"

// Define types
type User = {
  uid: string
  email: string | null
  displayName: string | null
  photoURL?: string | null
}

type AuthState = {
  user: User | null
  loading: boolean
  error: string | null
}

// Create a simple auth service
class AuthService {
  private static instance: AuthService
  private auth: any = null
  private app: any = null
  private firebaseInitialized = false
  private authStateListeners: ((state: AuthState) => void)[] = []
  private authState: AuthState = {
    user: null,
    loading: true,
    error: null,
  }
  private initializationPromise: Promise<void> | null = null

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
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
          // Initialize Firebase app first and wait for it to complete
          this.app = firebase.initializeApp(firebaseConfig)

          // Add a small delay to ensure app registration is complete
          await new Promise((resolve) => setTimeout(resolve, 100))
        }

        // Now import auth
        const { getAuth, onAuthStateChanged } = await import("firebase/auth")

        // Initialize auth
        this.auth = getAuth(this.app)

        // Set up auth state listener
        onAuthStateChanged(this.auth, (user: any) => {
          if (user) {
            this.authState = {
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
              },
              loading: false,
              error: null,
            }
          } else {
            this.authState = {
              user: null,
              loading: false,
              error: null,
            }
          }

          // Notify all listeners
          this.authStateListeners.forEach((listener) => listener(this.authState))
        })

        this.firebaseInitialized = true
        resolve()
      } catch (error: any) {
        console.error("Error initializing Firebase:", error)
        this.authState = {
          user: null,
          loading: false,
          error: error.message,
        }

        // Notify all listeners
        this.authStateListeners.forEach((listener) => listener(this.authState))
        reject(error)
      }
    })

    return this.initializationPromise
  }

  public async signIn(email: string, password: string) {
    await this.initializeFirebase()

    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth")
      await signInWithEmailAndPassword(this.auth, email, password)
      return true
    } catch (error: any) {
      console.error("Sign in error:", error)
      throw new Error(error.message)
    }
  }

  public async signInWithGoogle() {
    await this.initializeFirebase()

    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth")
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: "select_account" })
      await signInWithPopup(this.auth, provider)
      return true
    } catch (error: any) {
      console.error("Google sign in error:", error)
      throw new Error(error.message)
    }
  }

  public async signUp(email: string, password: string) {
    await this.initializeFirebase()

    try {
      const { createUserWithEmailAndPassword } = await import("firebase/auth")
      await createUserWithEmailAndPassword(this.auth, email, password)
      return true
    } catch (error: any) {
      console.error("Sign up error:", error)
      throw new Error(error.message)
    }
  }

  public async signOut() {
    await this.initializeFirebase()

    try {
      const { signOut } = await import("firebase/auth")
      await signOut(this.auth)
      return true
    } catch (error: any) {
      console.error("Sign out error:", error)
      throw new Error(error.message)
    }
  }

  public subscribeToAuthChanges(listener: (state: AuthState) => void) {
    this.authStateListeners.push(listener)

    // Initialize Firebase if not already done
    this.initializeFirebase().catch((error) => {
      console.error("Error during Firebase initialization:", error)
    })

    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter((l) => l !== listener)
    }
  }

  public getCurrentUser(): User | null {
    return this.authState.user
  }
}

// Create a hook to use the auth service
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const authService = AuthService.getInstance()
    const unsubscribe = authService.subscribeToAuthChanges(setAuthState)

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const authService = AuthService.getInstance()
    return await authService.signIn(email, password)
  }

  const signInWithGoogle = async () => {
    const authService = AuthService.getInstance()
    return await authService.signInWithGoogle()
  }

  const signUp = async (email: string, password: string) => {
    const authService = AuthService.getInstance()
    return await authService.signUp(email, password)
  }

  const signOut = async () => {
    const authService = AuthService.getInstance()
    return await authService.signOut()
  }

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
  }
}

// Export the auth service instance
export const authService = AuthService.getInstance()

