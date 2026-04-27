"use client"

import { LayoutDashboard, Plus, Settings, Shirt, User2, Sparkles } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/items",
    label: "My Closet",
    icon: Shirt,
  },
  {
    href: "/outfit",
    label: "Outfit Planner",
    icon: Sparkles,
  },
  {
    href: "/virtual-closet",
    label: "Virtual Closet",
    icon: Sparkles,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: Settings,
  },
]

export function DashboardNav() {
  const { userProfile } = useAuth()

  const getInitials = (name: string) => {
    if (!name) return ""
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex flex-col space-y-4">
      <Link href="/" className="flex items-center space-x-2 px-4">
        <Avatar>
          <AvatarImage src={userProfile?.photoURL} alt="Avatar" />
          <AvatarFallback>{getInitials(userProfile?.displayName || "")}</AvatarFallback>
        </Avatar>
        <span className="font-bold">{userProfile?.displayName || "User"}</span>
      </Link>
      <Separator />
      <div className="flex flex-col space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </div>
      <Separator />
      <div className="flex flex-col space-y-1">
        <div className="px-3 py-2 font-bold">Household</div>
        <Link
          href="/dashboard/household/new"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <Plus className="h-4 w-4" />
          Invite Household Member
        </Link>
        <Link
          href="/dashboard/household"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
        >
          <User2 className="h-4 w-4" />
          Manage Household
        </Link>
      </div>
    </div>
  )
}
