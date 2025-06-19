"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { Trip } from "@/lib/db-service"
import { Loader2, MapPin, Calendar, RefreshCw } from "lucide-react"
import { TripDetails } from "@/components/trip-details"
import { dbService } from "@/lib/db-service"
interface TripHistoryProps {
  trips: Trip[]
  loading: boolean
  onRefresh: () => void
}

export function TripHistory({ trips, loading, onRefresh }: TripHistoryProps) {
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [tripList, setTripList] = useState<any> ([])

  useEffect(()=>{
        setTripList(trips)
  },[])

  const handleDeleteTrip = (e:any,id:any) =>{
    e.stopPropagation()
    console.log(id)
    setTripList((prev:any)=>prev.filter((item:any)=>item.id!==id))
    dbService.deleteTrip(id)
  }
  console.log(trips)
  // Helper function to safely format dates
  const formatDate = (date: any) => {
    if (!date) return "N/A"

    // Check if date is a Firestore Timestamp and convert to JS Date
    if (date && typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString()
    }

    // Handle JS Date objects
    if (date instanceof Date) {
      return date.toLocaleDateString()
    }

    // Try to create a Date from the value
    try {
      return new Date(date).toLocaleDateString()
    } catch (e) {
      console.error("Invalid date format:", date, e)
      return "Invalid date"
    }
  }


    

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (trips.length === 0) {
    return (
      <Card className="border-border">
        <CardHeader>
          <CardTitle>No Trips Found</CardTitle>
          <CardDescription>You haven't created any trips yet. Start planning your first trip!</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Button onClick={onRefresh} variant="outline" className="border-border">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (selectedTrip) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setSelectedTrip(null)} className="border-border">
          Back to Trip History
        </Button>
        <TripDetails trip={selectedTrip} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Your Trips</h2>
        <Button variant="outline" size="sm" onClick={onRefresh} className="border-border">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tripList.map((trip:any) => (
          <Card
            key={trip.id}
            className="cursor-pointer hover:shadow-md transition-shadow border-border"
            onClick={() => setSelectedTrip(trip)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{trip.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">From</p>
                    <p className="font-medium">{trip.startLocation.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">To</p>
                    <p className="font-medium">{trip.endLocation.name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="w-full flex justify-between items-center">
                <span className="text-xs text-muted-foreground capitalize">{trip.tripType}</span>
                <span className="text-xs font-medium">{trip.days} days</span>
              </div>
            </CardFooter>
            <div className="btnContainer p-10 flex w-full justify-end">
                  <Button  onClick={(e) => handleDeleteTrip(e,trip.id)}>Delete</Button>
            </div>
         
          </Card>
        ))}
      </div>
    </div>
  )
}
