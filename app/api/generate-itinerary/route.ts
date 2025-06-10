import { type NextRequest, NextResponse } from "next/server"
import type { DayPlan, Location, TripType } from "@/lib/firebase-db"

export async function POST(request: NextRequest) {
  let startLocation: Location = {
      name: "", address: "",
      placeId: "",
      lat: 0,
      lng: 0
  }
  let endLocation: Location = {
      name: "", address: "",
      placeId: "",
      lat: 0,
      lng: 0
  }
  let days: number = 1
  let tripType: TripType = "holiday"

  try {
    ({ startLocation, endLocation, days, tripType } = await request.json())

    // Try to use AI SDK on server side
    try {
      const { generateText } = await import("ai")
      const { google } = await import("@ai-sdk/google")

      const gemini = google("gemini-1.5-flash")

      const detailedPrompt = `
You are a professional travel planner. Create a detailed ${days}-day itinerary for a ${tripType} trip from ${startLocation.name} to ${endLocation.name}.

Trip Details:
- Start: ${startLocation.name} (${startLocation.address})
- End: ${endLocation.name} (${endLocation.address})
- Duration: ${days} days
- Trip Type: ${tripType}

Requirements:
1. Include REAL places, attractions, and locations specific to the region
2. For religious trips: Include temples, churches, mosques, shrines, and spiritual sites
3. For adventure trips: Include hiking trails, water sports, adventure activities
4. For cultural trips: Include museums, historical sites, cultural centers, local experiences
5. For business trips: Include business districts, conference centers, networking venues
6. For holiday trips: Include tourist attractions, beaches, entertainment, relaxation spots

Format the response as a JSON array with this structure:
[
  {
    "day": 1,
    "activities": [
      {
        "time": "09:00 AM",
        "description": "Activity description with real place name",
        "location": {
          "name": "Real Place Name",
          "address": "Approximate address or area"
        },
        "notes": "Practical tips or additional information"
      }
    ]
  }
]

Make sure all places and activities are realistic and appropriate for the ${tripType} trip type.
`

      const { text } = await generateText({
        model: gemini,
        prompt: detailedPrompt,
        maxTokens: 4000,
      })

      // Try to parse the JSON response
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsedItinerary = JSON.parse(jsonMatch[0])
        return NextResponse.json({ success: true, itinerary: parsedItinerary })
      }

      throw new Error("No valid JSON found in AI response")
    } catch (aiError) {
      console.error("AI generation failed:", aiError)

      // Fallback to direct Gemini API call
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Create a detailed ${days}-day ${tripType} trip itinerary from ${startLocation.name} to ${endLocation.name}. Include real places and activities. Return only a JSON array format.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4000,
            },
          }),
        },
      )

      if (response.ok) {
        const data = await response.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

        // Try to parse JSON from the response
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const parsedItinerary = JSON.parse(jsonMatch[0])
          return NextResponse.json({ success: true, itinerary: parsedItinerary })
        }
      }

      // If response is not ok or no valid JSON found
      throw new Error("No valid JSON found in Gemini API response")
    }
  } catch (error) {
    console.error("Error in generate-itinerary API:", error)

    // Return enhanced mock data as fallback
    const mockItinerary = generateMockItinerary(startLocation, endLocation, days, tripType)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, itinerary: mockItinerary, error: errorMessage })
  }
}

function generateMockItinerary(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): DayPlan[] {
  // Enhanced mock implementation
  const activities = {
    religious: ["Temple visit", "Spiritual ceremony", "Religious site tour", "Meditation session"],
    cultural: ["Museum visit", "Historical site", "Cultural performance", "Local workshop"],
    adventure: ["Hiking trail", "Water sports", "Adventure activity", "Nature exploration"],
    business: ["Business meeting", "Conference", "Networking event", "Corporate visit"],
    holiday: ["Tourist attraction", "Beach visit", "Entertainment", "Shopping"],
  }

  const itinerary: DayPlan[] = []

  for (let day = 1; day <= days; day++) {
    const dayActivities = activities[tripType] || activities.holiday

    itinerary.push({
      day,
      activities: [
        {
          time: "09:00 AM",
          description: `${dayActivities[0]} in ${day === 1 ? startLocation.name : endLocation.name}`,
          notes: "Start your day with this amazing experience",
        },
        {
          time: "01:00 PM",
          description: "Local lunch experience",
          notes: "Try authentic regional cuisine",
        },
        {
          time: "03:00 PM",
          description: `${dayActivities[1]} exploration`,
          notes: "Discover the local culture and attractions",
        },
        {
          time: "06:00 PM",
          description: "Evening relaxation",
          notes: "Unwind and prepare for tomorrow",
        },
      ],
    })
  }

  return itinerary
}
