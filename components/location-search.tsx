"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import type { Location } from "@/lib/db-service"
import { MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LocationSearchProps {
  placeholder: string
  onLocationSelect: (location: Location) => void
}

export function LocationSearch({ placeholder, onLocationSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Handle search input changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 3) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}&types=place,address,poi&limit=5`,
        )
        const data = await response.json()
        setResults(data.features || [])
      } catch (error) {
        console.error("Error searching locations:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query])

  // Handle clicks outside the search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSelectLocation = (feature: any) => {
    const location: Location = {
      placeId: feature.id,
      name: feature.text,
      address: feature.place_name,
      lat: feature.center[1],
      lng: feature.center[0],
    }

    onLocationSelect(location)
    setQuery(feature.place_name)
    setShowResults(false)
  }

  const handleClearInput = () => {
    setQuery("")
    setResults([])
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full pr-10 border-border"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0 h-full w-10 p-0"
            onClick={handleClearInput}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear</span>
          </Button>
        )}
      </div>

      {showResults && (results.length > 0 || isLoading) && (
        <div
          ref={resultsRef}
          className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-lg"
        >
          {isLoading ? (
            <div className="p-2 text-center text-sm text-muted-foreground">Searching...</div>
          ) : (
            <ul className="max-h-60 overflow-auto py-1">
              {results.map((feature) => (
                <li
                  key={feature.id}
                  className="cursor-pointer px-3 py-2 hover:bg-muted"
                  onClick={() => handleSelectLocation(feature)}
                >
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{feature.text}</p>
                      <p className="text-xs text-muted-foreground">{feature.place_name}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

