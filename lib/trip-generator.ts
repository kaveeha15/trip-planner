import type { DayPlan, Location, TripType } from "./firebase-db"
import { generateAIItinerary, generateAIItineraryWithFetch } from "./ai-trip-generator"

// Main function that tries AI first, then falls back to mock data
export async function generateItinerary(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): Promise<DayPlan[]> {
  try {
    console.log("Generating itinerary with AI...")

    // Try client-side AI first
    try {
      const aiItinerary = await generateAIItinerary(startLocation, endLocation, days, tripType)
      if (aiItinerary && aiItinerary.length > 0) {
        console.log("Successfully generated AI itinerary (client-side)")
        return aiItinerary
      }
    } catch (clientError) {
      console.log("Client-side AI failed, trying server-side...")

      // Try server-side API
      const serverItinerary = await generateAIItineraryWithFetch(startLocation, endLocation, days, tripType)
      if (serverItinerary && serverItinerary.length > 0) {
        console.log("Successfully generated AI itinerary (server-side)")
        return serverItinerary
      }
    }

    throw new Error("All AI methods failed")
  } catch (error) {
    console.error("AI generation failed, using enhanced fallback:", error)

    // Fallback to enhanced mock implementation
    return generateEnhancedMockItinerary(startLocation, endLocation, days, tripType)
  }
}

// Enhanced mock implementation as final fallback
async function generateEnhancedMockItinerary(
  startLocation: Location,
  endLocation: Location,
  days: number,
  tripType: TripType,
): Promise<DayPlan[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const itinerary: DayPlan[] = []

  // Enhanced location-specific suggestions
  const getLocationActivities = (locName: string, type: TripType) => {
    type ActivityType = "religious" | "cultural" | "adventure" | "business" | "holiday";
    type LocationKey = "colombo" | "galle";
    const activities: Record<LocationKey, Record<ActivityType, string[]>> = {
      colombo: {
        religious: ["Gangaramaya Temple", "Red Mosque", "St. Lucia's Cathedral"],
        cultural: ["National Museum", "Independence Memorial Hall", "Pettah Market"],
        adventure: ["Mount Lavinia Beach", "Beira Lake", "Diyatha Uyana"],
        business: ["World Trade Center", "Colombo Stock Exchange"],
        holiday: ["Galle Face Green", "Viharamahadevi Park", "One Galle Face Mall"],
      },
      galle: {
        religious: ["Galle Fort Mosque", "Dutch Reformed Church"],
        cultural: ["Galle Fort", "National Maritime Museum", "Galle Lighthouse"],
        adventure: ["Unawatuna Beach", "Jungle Beach", "Whale Watching"],
        business: ["Galle Chamber of Commerce"],
        holiday: ["Mirissa Beach", "Coconut Tree Hill", "Stilt Fishermen"],
      },
    };

    const key = locName.toLowerCase() as LocationKey;
    return activities[key]?.[type as ActivityType] || [`${type} attraction in ${locName}`, `Local ${type} site`];
  }

  const startActivities = getLocationActivities(startLocation.name, tripType)
  const endActivities = getLocationActivities(endLocation.name, tripType)

  for (let day = 1; day <= days; day++) {
    const activities = []

    if (day === 1) {
      activities.push({
        time: "09:00 AM",
        description: `Departure from ${startLocation.name}`,
        location: startLocation,
        notes: "Begin your journey",
      })

      activities.push({
        time: "11:00 AM",
        description: `Visit ${startActivities[0]}`,
        notes: `Explore this ${tripType} attraction`,
      })

      activities.push({
        time: "01:00 PM",
        description: "Local lunch",
        notes: "Try regional cuisine",
      })

      activities.push({
        time: "03:00 PM",
        description: `Explore ${startActivities[1] || "local area"}`,
        notes: "Discover local culture",
      })
    } else if (day === days) {
      activities.push({
        time: "09:00 AM",
        description: "Morning preparation",
        notes: "Pack and prepare for final destination",
      })

      activities.push({
        time: "11:00 AM",
        description: `Visit ${endActivities[0]}`,
        notes: "Experience destination highlights",
      })

      activities.push({
        time: "02:00 PM",
        description: `Arrival at ${endLocation.name}`,
        location: endLocation,
        notes: "Complete your journey",
      })
    } else {
      const midActivities = day % 2 === 0 ? startActivities : endActivities

      activities.push({
        time: "09:00 AM",
        description: "Morning exploration",
        notes: "Start the day with local experiences",
      })

      activities.push({
        time: "11:00 AM",
        description: `Visit ${midActivities[day % midActivities.length]}`,
        notes: `Enjoy ${tripType} activities`,
      })

      activities.push({
        time: "01:00 PM",
        description: "Traditional lunch",
        notes: "Taste local specialties",
      })

      activities.push({
        time: "03:00 PM",
        description: "Afternoon activities",
        notes: "Continue exploring",
      })
    }

    itinerary.push({ day, activities })
  }

  return itinerary
}
