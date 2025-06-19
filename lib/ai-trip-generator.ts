import type { DayPlan, Activity, Location, TripType } from "./firebase-db"

// AI-powered trip generator using Gemini

export async function generateSuggestedLocations ( startLocation: Location,
  endLocation: Location,days: number, tripType: TripType ){
//     const { generateText } = await import("ai")
//     const { google } = await import("@ai-sdk/google")
    const apiKey = "AIzaSyBEmPWCACW9BcYJjYRIapbbk5eFCjUti3M"
//     const gemini = google("gemini-1.5-flash")
      
   // const prompt = `You are a professional travel planner. Create a list of suggested locations based on the
   // ${startLocation} as the trip start location and the ${endLocation} as the trip end location for a  ${days} days ${tripType} type trip. this is for a vacation trip. give this as an an array. 

//`   
//
//      const { text } = await generateText({
//       model: gemini,
//       prompt: prompt,
//       maxTokens: 4000,
      
//     })

//     console.log("Ai responce is",text)

const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
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
                    text:`Create a list of suggested locations based on the
                    ${startLocation.address} as the trip start location and the ${endLocation.address} as the trip end location for a  ${days} days ${tripType} type trip. give me at least 10 places, do not include words in your responce, just the names of the suggested places names only`   ,
                  },
                ],
              },
            ],
          
          }),
        },
      )
      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
     const locations = text.trim().split('\n')
          console.log(locations)
      return locations
}

export async function generateAIItinerary(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): Promise<DayPlan[]> {
  try {
    // Import AI SDK dynamically to avoid module resolution issues
    const { generateText } = await import("ai")
    const { google } = await import("@ai-sdk/google")

    // Initialize Gemini model
    const gemini = google("gemini-1.5-flash")

    // Create a detailed prompt for the AI
    const prompt = `
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

For each day, provide:
- 4-6 activities with specific times (format: "HH:MM AM/PM")
- Real place names and locations
- Brief descriptions of activities
- Practical notes and tips
- Realistic travel times between locations

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

Make sure all places and activities are realistic and appropriate for the ${tripType} trip type in the ${startLocation.name} to ${endLocation.name} region.
`

    console.log("Generating AI itinerary with Gemini...")

    const { text } = await generateText({
      model: gemini,
      prompt: prompt,
      maxTokens: 4000,
    })

    console.log("AI Response:", text)

    // Try to parse the JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error("No JSON array found in response")
      }

      const parsedItinerary = JSON.parse(jsonMatch[0]) as DayPlan[]

      // Validate and clean the response
      const validatedItinerary = parsedItinerary.map((day, index) => ({
        day: index + 1,
        activities:
          day.activities?.map((activity: any) => ({
            time: activity.time || "09:00 AM",
            description: activity.description || "Activity",
            location: activity.location
              ? {
                  name: activity.location.name || "Location",
                  address: activity.location.address || "Address",
                  placeId: `ai-generated-${Date.now()}-${Math.random()}`,
                  lat: startLocation.lat + (Math.random() - 0.5) * 0.1, // Approximate location
                  lng: startLocation.lng + (Math.random() - 0.5) * 0.1,
                }
              : undefined,
            notes: activity.notes || "",
          })) || [],
      }))

      return validatedItinerary.slice(0, days) // Ensure we don't exceed requested days
    } catch (parseError) {
      console.error("Error parsing AI response:", parseError)
      console.log("Raw AI response:", text)

      // Fallback to enhanced mock data if parsing fails
      return generateEnhancedMockItinerary(startLocation, endLocation, days, tripType)
    }
  } catch (error) {
    console.error("Error generating AI itinerary:", error)

    // Fallback to enhanced mock data
    return generateEnhancedMockItinerary(startLocation, endLocation, days, tripType)
  }
}

// Enhanced fallback function with more realistic data
function generateEnhancedMockItinerary(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): DayPlan[] {
  const itinerary: DayPlan[] = []

  // Enhanced location-specific suggestions based on common destinations
  const getLocationSpecificActivities = (locName: string, type: TripType) => {
    const locationActivities: Record<string, Record<TripType, string[]>> = {
      colombo: {
        religious: ["Gangaramaya Temple", "Red Mosque", "St. Lucia's Cathedral", "Kelaniya Raja Maha Vihara"],
        cultural: ["National Museum", "Independence Memorial Hall", "Old Parliament Building", "Pettah Market"],
        adventure: ["Diyatha Uyana", "Beira Lake", "Mount Lavinia Beach", "Dehiwala Zoo"],
        business: ["World Trade Center", "Colombo Stock Exchange", "Bank of Ceylon", "Commercial Bank"],
        holiday: ["Galle Face Green", "Viharamahadevi Park", "Arcade Independence Square", "One Galle Face Mall"],
      },
      galle: {
        religious: ["Galle Fort Mosque", "Dutch Reformed Church", "Buddhist Temple Galle", "St. Mary's Cathedral"],
        cultural: ["Galle Fort", "National Maritime Museum", "Dutch Hospital Shopping Precinct", "Galle Lighthouse"],
        adventure: ["Unawatuna Beach", "Jungle Beach", "Snake Island", "Whale Watching"],
        business: ["Galle Chamber of Commerce", "Export Development Board", "Galle Business Center"],
        holiday: ["Mirissa Beach", "Coconut Tree Hill", "Stilt Fishermen", "Turtle Hatchery"],
      },
      kandy: {
        religious: [
          "Temple of the Tooth",
          "Bahirawakanda Vihara Buddha Statue",
          "Embekke Devalaya",
          "Gadaladeniya Temple",
        ],
        cultural: ["Royal Botanical Gardens", "Kandy Cultural Centre", "Ceylon Tea Museum", "Udawattakele Sanctuary"],
        adventure: ["Hanthana Mountain Range", "Knuckles Mountain Range", "Victoria Golf Club", "Kandy Lake"],
        business: ["Kandy City Centre", "Central Province Chamber", "Kandy Business District"],
        holiday: ["Peradeniya Botanical Garden", "Bahirawakanda Temple", "Kandy View Point", "Royal Palace of Kandy"],
      },
      // Add more cities as needed
      default: {
        religious: ["Local Temple", "Community Church", "Spiritual Center", "Religious Monument"],
        cultural: ["Local Museum", "Cultural Center", "Historical Site", "Art Gallery"],
        adventure: ["Nature Park", "Adventure Center", "Outdoor Activity", "Sports Complex"],
        business: ["Business District", "Conference Center", "Commercial Area", "Trade Center"],
        holiday: ["Tourist Attraction", "Recreation Center", "Entertainment Complex", "Shopping Area"],
      },
    }

    const startKey = locName.toLowerCase()
    return (
      locationActivities[startKey]?.[type] ||
      locationActivities.default[type] || [
        `Local ${type} attraction in ${locName}`,
        `Traditional ${type} site near ${locName}`,
        `Popular ${type} destination in the area`,
      ]
    )
  }

  const startActivities = getLocationSpecificActivities(startLocation.name, tripType)
  const endActivities = getLocationSpecificActivities(endLocation.name, tripType)

  for (let day = 1; day <= days; day++) {
    const activities: Activity[] = []

    if (day === 1) {
      // First day - start location
      activities.push({
        time: "09:00 AM",
        description: `Departure from ${startLocation.name}`,
        location: startLocation,
        notes: "Begin your journey and check all travel documents",
      })

      activities.push({
        time: "11:00 AM",
        description: `Visit ${startActivities[0]}`,
        notes: `Explore this significant ${tripType} site`,
      })

      activities.push({
        time: "01:00 PM",
        description: "Lunch at local restaurant",
        notes: "Try authentic local cuisine",
      })

      activities.push({
        time: "03:00 PM",
        description: `Explore ${startActivities[1]}`,
        notes: `Learn about local ${tripType} culture and history`,
      })

      activities.push({
        time: "06:00 PM",
        description: "Evening relaxation and dinner",
        notes: "Rest and prepare for tomorrow's activities",
      })
    } else if (day === days) {
      // Last day - end location
      activities.push({
        time: "09:00 AM",
        description: "Morning preparation and checkout",
        notes: "Pack belongings and prepare for final destination",
      })

      activities.push({
        time: "11:00 AM",
        description: `Visit ${endActivities[0]}`,
        notes: `Experience the renowned ${tripType} attractions`,
      })

      activities.push({
        time: "01:00 PM",
        description: "Farewell lunch",
        notes: "Enjoy final meal and reflect on the journey",
      })

      activities.push({
        time: "03:00 PM",
        description: `Arrival at ${endLocation.name}`,
        location: endLocation,
        notes: "Complete your journey successfully",
      })
    } else {
      // Middle days
      const midActivities = day % 2 === 0 ? startActivities : endActivities
      const locationName = day % 2 === 0 ? startLocation.name : endLocation.name

      activities.push({
        time: "09:00 AM",
        description: "Morning breakfast and planning",
        notes: "Start the day with energy and enthusiasm",
      })

      activities.push({
        time: "10:30 AM",
        description: `Explore ${midActivities[day % midActivities.length]}`,
        notes: `Discover the beauty of ${tripType} heritage in ${locationName}`,
      })

      activities.push({
        time: "01:00 PM",
        description: "Traditional lunch experience",
        notes: "Taste authentic regional specialties",
      })

      activities.push({
        time: "03:00 PM",
        description: `Visit ${midActivities[(day + 1) % midActivities.length]}`,
        notes: `Immerse yourself in ${tripType} activities`,
      })

      activities.push({
        time: "06:00 PM",
        description: "Evening cultural experience",
        notes: "Engage with local traditions and customs",
      })
    }

    itinerary.push({ day, activities })
  }

  return itinerary
}

// Alternative implementation using fetch API if AI SDK is not available
export async function generateAIItineraryWithFetch(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): Promise<DayPlan[]> {
  try {
    const prompt = `Create a detailed ${days}-day ${tripType} trip itinerary from ${startLocation.name} to ${endLocation.name}. Include real places and specific activities for each day. Format as JSON array with day and activities structure.`

    const response = await fetch("/api/generate-itinerary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        startLocation,
        endLocation,
        days,
        tripType,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to generate itinerary")
    }

    const data = await response.json()
    return data.itinerary || generateEnhancedMockItinerary(startLocation, endLocation, days, tripType)
  } catch (error) {
    console.error("Error with fetch-based AI generation:", error)
    return generateEnhancedMockItinerary(startLocation, endLocation, days, tripType)
  }
}
