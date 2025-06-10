"use client"

import { useEffect, useState } from "react"
import { authService } from "@/lib/auth-service"

export function FirebaseInit() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // This will trigger Firebase initialization
    const unsubscribe = authService.subscribeToAuthChanges(() => {
      setInitialized(true)
    })

    return () => unsubscribe()
  }, [])

  return null // This component doesn't render anything
}

