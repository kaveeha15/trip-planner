"use client"
import { useEffect, useState } from "react"

import { generateSuggestedLocations } from "@/lib/ai-trip-generator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { Trip } from "@/lib/db-service"
import { MapPin, Calendar } from "lucide-react"
import { MapboxMap } from "@/components/mapbox-map"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface TripDetailsProps {
  trip: Trip
}

export function TripDetails({ trip }: TripDetailsProps) {


  console.log("trip", trip)
 const [suggestedLocations, setSuggestedLocations] = useState([])
  const getSuggestions  = async ()=>{
    const locations = await generateSuggestedLocations(trip.startLocation,trip.endLocation,trip.days,trip.tripType) 
    setSuggestedLocations(locations)
  }

 
  useEffect(()=>{
    getSuggestions()
  
  },[])


  const [localTrip, setLocalTrip] = useState<Trip>(trip)
  const [editing, setEditing] = useState<{
    day: number
    activityIndex: number
  } | null>(null)

  const formatDate = (date: any) => {
    if (!date) return "N/A"
    if (typeof date.toDate === "function") return date.toDate().toLocaleDateString()
    if (date instanceof Date) return date.toLocaleDateString()
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  const handleChange = (
    dayNumber: number,
    activityIndex: number,
    field: string,
    value: any
  ) => {
    const updated = { ...localTrip }
    const day = updated.itinerary.find((d) => d.day === dayNumber)
    if (!day) return

    const activity = day.activities[activityIndex]
    if (!activity) return

    if (field === "location") {
      activity.location =
        typeof activity.location === "object" && activity.location !== null
          ? { ...activity.location, name: value }
          : { name: value }
    } else if (field === "description") {
      activity.description = value
    } else {
      ;(activity as any)[field] = value
    }

    setLocalTrip(updated)
  }



  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Trip View */}
      <div className="flex-1">
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
              <MapboxMap
                startLocation={trip.startLocation}
                endLocation={trip.endLocation}
              />
            </div>

            <Tabs defaultValue="day-1" className="w-full">
              <TabsList className="w-full flex-wrap gap-2 justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {localTrip.itinerary.map((day) => (
                    <TabsTrigger key={day.day} value={`day-${day.day}`}>
                      Day {day.day}
                    </TabsTrigger>
                  ))}
                </div>
                <Button>Save</Button>
              </TabsList>

              {localTrip.itinerary.map((day) => (
                <TabsContent
                  key={day.day}
                  value={`day-${day.day}`}
                  className="space-y-4"
                >
                  <h4 className="font-medium">Day {day.day}</h4>
                  {day.activities.map((activity, index) => {
                    const isEditing =
                      editing?.day === day.day && editing.activityIndex === index
                    return (
                      <Card key={index} className="border-border p-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <Input
                              value={activity.time}
                              onChange={(e) =>
                                handleChange(day.day, index, "time", e.target.value)
                              }
                            />
                            <Input
                              value={activity.description || ""}
                              onChange={(e) =>
                                handleChange(
                                  day.day,
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                            />
                            <Input
                              value={
                                typeof activity.location === "object"
                                  ? activity.location?.name || ""
                                  : typeof activity.location === "string"
                                  ? activity.location
                                  : ""
                              }
                              onChange={(e) =>
                                handleChange(day.day, index, "location", e.target.value)
                              }
                            />
                            <Textarea
                              value={activity.notes || ""}
                              onChange={(e) =>
                                handleChange(day.day, index, "notes", e.target.value)
                              }
                            />
                            <Button
                              onClick={() => setEditing(null)}
                              className="mt-2"
                              variant="secondary"
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <>
                            <CardHeader className="py-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">
                                  {activity.time}
                                </CardTitle>
                                {typeof activity.location === "object" &&
                                  activity.location?.name && (
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {activity.location.name}
                                    </div>
                                  )}
                              </div>
                            </CardHeader>
                            <CardContent className="py-2">
                              <p className="text-sm">{activity.description}</p>
                              {activity.notes && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  {activity.notes}
                                </p>
                              )}
                              <Button
                                onClick={() =>
                                  setEditing({ day: day.day, activityIndex: index })
                                }
                                className="mt-2"
                                size="sm"
                                variant="outline"
                              >
                                Edit
                              </Button>
                            </CardContent>
                          </>
                        )}
                      </Card>
                    )
                  })}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Locations Sidebar */}
      <aside className="w-full lg:w-80 border border-border rounded-md p-4 space-y-4">
        <h3 className="text-lg font-semibold">Suggested Places</h3>
        <ul className="space-y-2 text-sm">
          {suggestedLocations&&suggestedLocations.map((place, i) => (
            <li key={i}>
              <strong>{place}</strong> 
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
