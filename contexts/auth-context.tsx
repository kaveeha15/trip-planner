"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useAuth as useAuthService } from "@/lib/auth-service"

interface AuthContextType {
  user: any | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signInWithGoogle: () => Promise<boolean>
  signUp: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  signIn: async () => false,
  signInWithGoogle: async () => false,
  signUp: async () => false,
  signOut: async () => false,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthService()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

