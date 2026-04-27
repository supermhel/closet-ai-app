"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Heart, Calendar, ArrowRight, Shirt } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function OutfitSuggestions() {
  const [activeTab, setActiveTab] = useState("today")

  const outfitCategories = {
    today: [
      {
        id: 1,
        name: "Casual Day Out",
        items: ["Blue Jeans", "White T-Shirt", "Denim Jacket", "Sneakers"],
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        id: 2,
        name: "Office Ready",
        items: ["Black Pants", "Button-up Shirt", "Blazer", "Loafers"],
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        id: 3,
        name: "Evening Plans",
        items: ["Dark Jeans", "Dress Shirt", "Leather Jacket", "Chelsea Boots"],
        image: "/placeholder.svg?height=200&width=200",
      },
    ],
    favorites: [
      {
        id: 4,
        name: "Weekend Casual",
        items: ["Chinos", "Polo Shirt", "Light Sweater", "Casual Shoes"],
        image: "/placeholder.svg?height=200&width=200",
      },
      {
        id: 5,
        name: "Date Night",
        items: ["Dress Pants", "Dress Shirt", "Sport Coat", "Dress Shoes"],
        image: "/placeholder.svg?height=200&width=200",
      },
    ],
    upcoming: [
      {
        id: 6,
        name: "Business Meeting",
        items: ["Suit", "Dress Shirt", "Tie", "Oxford Shoes"],
        image: "/placeholder.svg?height=200&width=200",
        date: "Tomorrow, 10:00 AM",
      },
      {
        id: 7,
        name: "Weekend Brunch",
        items: ["Jeans", "Casual Shirt", "Light Jacket", "Sneakers"],
        image: "/placeholder.svg?height=200&width=200",
        date: "Saturday, 11:30 AM",
      },
    ],
  }

  return (
    <div className="space-y-6 py-4">
      <Tabs defaultValue="today" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="today">Today's Picks</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {outfitCategories.today.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
          <Button className="w-full">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate More Outfits
          </Button>
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {outfitCategories.favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outfitCategories.favorites.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-4">Save your favorite outfits to access them quickly</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {outfitCategories.upcoming.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outfitCategories.upcoming.map((outfit) => (
                <OutfitCard key={outfit.id} outfit={outfit} showDate />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No upcoming events</h3>
              <p className="text-muted-foreground mb-4">Connect your calendar to plan outfits for events</p>
              <Button>Connect Calendar</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href="/outfit">
            View All Outfits
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function OutfitCard({ outfit, showDate = false }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex">
        <div className="w-1/3 relative">
          <Image
            src={outfit.image || "/placeholder.svg"}
            alt={outfit.name}
            width={100}
            height={100}
            className="object-cover h-full"
          />
        </div>
        <CardContent className="p-3 w-2/3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-sm">{outfit.name}</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
          {showDate && (
            <p className="text-xs text-muted-foreground mb-1 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {outfit.date}
            </p>
          )}
          <ul className="text-xs text-muted-foreground">
            {outfit.items.map((item, i) => (
              <li key={i} className="flex items-center">
                <Shirt className="h-3 w-3 mr-1 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </div>
    </Card>
  )
}
