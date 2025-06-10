"use client"

import { getFirebaseAuth } from "./firebase"

// Sign in with email and password
export const signIn = async (email: string, password: string) => {
  const auth = await getFirebaseAuth()
  const { signInWithEmailAndPassword } = await import("firebase/auth")
  return await signInWithEmailAndPassword(auth, email, password)
}

// Sign up with email and password
export const signUp = async (email: string, password: string) => {
  const auth = await getFirebaseAuth()
  const { createUserWithEmailAndPassword } = await import("firebase/auth")
  return await createUserWithEmailAndPassword(auth, email, password)
}

// Sign out
export const signOut = async () => {
  const auth = await getFirebaseAuth()
  const { signOut: firebaseSignOut } = await import("firebase/auth")
  return await firebaseSignOut(auth)
}

// Get current user
export const getCurrentUser = async () => {
  const auth = await getFirebaseAuth()
  return auth.currentUser
}

// Auth state observer
export const onAuthStateChange = async (callback: (user: any | null) => void) => {
  const auth = await getFirebaseAuth()
  const { onAuthStateChanged } = await import("firebase/auth")
  return onAuthStateChanged(auth, callback)
}

