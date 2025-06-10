"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Trip } from "@/lib/db-service"
import { MapPin, Calendar } from "lucide-react"
import { MapboxMap } from "@/components/mapbox-map"

interface TripDetailsProps {
  trip: Trip
}

export function TripDetails({ trip }: TripDetailsProps) {
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

  return (
    <Card className="w-full border-border">
      <CardHeader>
        <CardTitle>{trip.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          <span className="mx-2">•</span>
          <span className="capitalize">{trip.tripType}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-64 w-full rounded-md overflow-hidden border border-border">
          <MapboxMap startLocation={trip.startLocation} endLocation={trip.endLocation} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Starting Point</h3>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{trip.startLocation.name}</p>
                <p className="text-sm text-muted-foreground">{trip.startLocation.address}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Destination</h3>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{trip.endLocation.name}</p>
                <p className="text-sm text-muted-foreground">{trip.endLocation.address}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Itinerary</h3>

          <Tabs defaultValue={`day-1`} className="w-full">
            <TabsList className="w-full flex-wrap h-auto justify-start">
              {trip.itinerary.map((day) => (
                <TabsTrigger key={day.day} value={`day-${day.day}`} className="flex-grow-0">
                  Day {day.day}
                </TabsTrigger>
              ))}
            </TabsList>

            {trip.itinerary.map((day) => (
              <TabsContent key={day.day} value={`day-${day.day}`} className="space-y-4">
                <h4 className="font-medium">Day {day.day}</h4>

                <div className="space-y-4">
                  {day.activities.map((activity, index) => (
                    <Card key={index} className="border-border">
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">{activity.time}</CardTitle>
                          {activity.location && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 mr-1" />
                              {activity.location.name}
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-sm">{activity.description}</p>
                        {activity.notes && <p className="text-xs text-muted-foreground mt-2">{activity.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
//       </TabsContent>