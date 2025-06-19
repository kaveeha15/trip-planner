"use client"

import { useState, Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Loader2, MapPin, Sparkles } from "lucide-react"
import { MapboxMap } from "@/components/mapbox-map"
import { LocationSearch } from "@/components/location-search"
import { saveTrip, type TripType, type Location } from "@/lib/firebase-db"
import { generateItinerary } from "@/lib/trip-generator"
import { useAuth } from "@/contexts/auth-context"

interface TripPlannerProps {
  onTripCreated: () => void
}

// Simple loading component for the map
function MapLoading() {
  return (
    <div className="h-64 w-full flex items-center justify-center bg-muted">
      <div className="animate-pulse text-muted-foreground">Loading map...</div>
    </div>
  )
}

export function TripPlanner({ onTripCreated }: TripPlannerProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [tripName, setTripName] = useState("")
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [tripType, setTripType] = useState<TripType>("holiday")
  const [error, setError] = useState<string | null>(null)
  const [generationStatus, setGenerationStatus] = useState<string>("")

  const handleNext = () => {
    setStep(step + 1)
  }

  const handleBack = () => {
    setStep(step - 1)
  }

  const handleCreateTrip = async () => {
    if (!startLocation || !endLocation || !startDate || !endDate || !tripName || !user) {
      setError("Missing required information")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setGenerationStatus("Preparing trip details...")

      const start = new Date(startDate)
      const end = new Date(endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      setGenerationStatus("🤖 Generating AI-powered itinerary with real places...")

      // Generate itinerary based on locations, dates, and trip type
      const itinerary = await generateItinerary(startLocation, endLocation, days, tripType)

      setGenerationStatus("💾 Saving your personalized trip...")

      // Save trip to Firebase
      await saveTrip(
        {
          name: tripName,
          startLocation,
          endLocation,
          startDate: start,
          endDate: end,
          days,
          tripType,
          itinerary,
        },
        user.uid,
      ) 

      setGenerationStatus("✅ Trip created successfully!")
      setTimeout(() => {
        onTripCreated()
      }, 1000)
    } catch (error) {
      console.error("Error creating trip:", error)
      setError(error instanceof Error ? error.message : "Failed to create trip")
      setGenerationStatus("")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          Plan Your AI-Powered Trip
        </CardTitle>
        <CardDescription>
          {step === 1 && "Start by naming your trip and selecting locations"}
          {step === 2 && "Choose your travel dates"}
          {step === 3 && "Select the type of trip - AI will suggest real places based on your choice"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md">
            <p>{error}</p>
          </div>
        )}

        {generationStatus && (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
            <p className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {generationStatus}
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trip-name">Trip Name</Label>
              <Input
                id="trip-name"
                placeholder="Summer Vacation 2023"
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                className="border-border"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Starting Location</Label>
                <LocationSearch placeholder="Search for starting location" onLocationSelect={setStartLocation} />
                {startLocation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{startLocation.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Destination</Label>
                <LocationSearch placeholder="Search for destination" onLocationSelect={setEndLocation} />
                {endLocation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{endLocation.name}</span>
                  </div>
                )}
              </div>
            </div>



            {(startLocation || endLocation) && (
              <div className="h-64 w-full rounded-md overflow-hidden border border-border">
                <Suspense fallback={<MapLoading />}>
                  <MapboxMap startLocation={startLocation} endLocation={endLocation} />
                </Suspense>
              </div>
            )}
          </div>
        )}



        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-border"
                />
              </div>
            </div>

            {startDate && endDate && new Date(startDate) <= new Date(endDate) && (
              <div className="p-4 bg-muted rounded-md">
                <p className="text-sm font-medium">Trip Duration</p>
                <p className="text-2xl font-bold">
                  {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}{" "}
                  days
                </p>
              </div>
            )}

            {startDate && endDate && new Date(startDate) > new Date(endDate) && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                <p className="text-sm">End date must be after start date</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="trip-type">Trip Type</Label>
              <Select value={tripType} onValueChange={(value) => setTripType(value as TripType)}>
                <SelectTrigger className="border-border">
                  <SelectValue placeholder="Select trip type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="holiday">🏖️ Holiday / Vacation</SelectItem>
                  <SelectItem value="religious">🕌 Religious</SelectItem>
                  <SelectItem value="business">💼 Business</SelectItem>
                  <SelectItem value="adventure">🏔️ Adventure</SelectItem>
                  <SelectItem value="cultural">🏛️ Cultural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-md border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-medium text-blue-900">AI-Powered Suggestions</h3>
              </div>
              <p className="text-sm text-blue-700">
                Our AI will generate personalized recommendations with real places based on your trip type:
              </p>
              <ul className="text-xs text-blue-600 mt-2 space-y-1">
                {tripType === "religious" && (
                  <>
                    <li>• Sacred temples, churches, and spiritual sites</li>
                    <li>• Religious ceremonies and cultural experiences</li>
                    <li>• Historical religious landmarks</li>
                  </>
                )}
                {tripType === "adventure" && (
                  <>
                    <li>• Hiking trails and mountain peaks</li>
                    <li>• Water sports and outdoor activities</li>
                    <li>• Adventure parks and nature reserves</li>
                  </>
                )}
                {tripType === "cultural" && (
                  <>
                    <li>• Museums and historical sites</li>
                    <li>• Cultural centers and art galleries</li>
                    <li>• Traditional workshops and local experiences</li>
                  </>
                )}
                {tripType === "business" && (
                  <>
                    <li>• Business districts and conference centers</li>
                    <li>• Networking venues and professional spaces</li>
                    <li>• Corporate facilities and meeting locations</li>
                  </>
                )}
                {tripType === "holiday" && (
                  <>
                    <li>• Tourist attractions and entertainment</li>
                    <li>• Beaches, parks, and relaxation spots</li>
                    <li>• Shopping centers and recreational activities</li>
                  </>
                )}
              </ul>
            </div>

            <div className="p-4 bg-muted rounded-md">
              <h3 className="font-medium mb-2">Trip Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trip Name:</span>
                  <span className="font-medium">{tripName}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span className="font-medium">{startLocation?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span className="font-medium">{endLocation?.name}</span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dates:</span>
                  <span className="font-medium">
                    {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) +
                      1}{" "}
                    days
                  </span>
                </div>
                <Separator className="bg-border" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trip Type:</span>
                  <span className="font-medium capitalize">{tripType}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {step > 1 ? (
          <Button variant="outline" onClick={handleBack} className="border-border" disabled={loading}>
            Back
          </Button>
        ) : (
          <div></div>
        )}

        {step < 3 ? (
          <Button
            onClick={handleNext}
            disabled={
              (step === 1 && (!startLocation || !endLocation || !tripName)) ||
              (step === 2 && (!startDate || !endDate || new Date(startDate) > new Date(endDate)))
            }
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleCreateTrip} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI Trip Plan...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Create AI Trip Plan
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
