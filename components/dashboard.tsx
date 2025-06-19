"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { dbService, type Trip } from "@/lib/db-service"
import { TripPlanner } from "@/components/trip-planner"
import { TripHistory } from "@/components/trip-history"
import { LogOut, User, RefreshCw } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function Dashboard() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("planner")
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [indexCreated, setIndexCreated] = useState(false)
console.log(trips)
  
  useEffect(() => {
    loadTrips()
  }, [])

  const loadTrips = async () => {
    try {
      setLoading(true)
      setError(null)
      const userTrips = await dbService.getUserTrips()
      setTrips(userTrips)
      setIndexCreated(true) // If we got trips successfully, index must be created
    } catch (error: any) {
      console.error("Error loading trips:", error)

      // Check if it's the index error
      if (error.message && error.message.includes("index")) {
        const indexUrl = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/g)?.[0]
        setError(`Please create the required Firestore index by clicking the button below.`)

        // Store the index URL in local storage for the "Create Index" button
        if (indexUrl) {
          localStorage.setItem("firestoreIndexUrl", indexUrl)
        }
      } else {
        setError(`Error loading trips: ${error.message || "Unknown error"}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIndex = () => {
    const indexUrl = localStorage.getItem("firestoreIndexUrl")
    if (indexUrl) {
      window.open(indexUrl, "_blank")
    } else {
      window.open("https://console.firebase.google.com", "_blank")
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleTripCreated = () => {
    loadTrips()
    setActiveTab("history")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Trip Planner Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                {user?.photoURL ? (
                  <AvatarImage
                    src={user.photoURL || "/placeholder.svg"}
                    alt={user.displayName || user.email || "User"}
                  />
                ) : null}
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline-block">
                {user?.displayName || user?.email || "User"}
              </span>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="border-border">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
                
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && !indexCreated && (
          <Alert className="mb-4" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex flex-col space-y-2">
              <p>{error}</p>
              {error.includes("index") && (
                <Button onClick={handleCreateIndex} className="self-start" size="sm">
                  Create Firebase Index
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="planner">Plan New Trip</TabsTrigger>
            <TabsTrigger value="history">Trip History</TabsTrigger>
          </TabsList>

          <TabsContent value="planner" className="mt-6">
            <TripPlanner onTripCreated={handleTripCreated} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="text-right mb-4">
              <Button variant="outline" size="sm" onClick={loadTrips} className="border-border">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Trips
              </Button>
            </div>
            <TripHistory trips={trips} loading={loading} onRefresh={loadTrips} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
