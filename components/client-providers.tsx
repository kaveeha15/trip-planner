"use client"

import type { ReactNode } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { FirebaseInit } from "@/components/firebase-init"

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FirebaseInit />
      {children}
    </AuthProvider>
  )
}

