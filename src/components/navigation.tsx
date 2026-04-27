"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Menu, Home, Shirt, Package, Layers, User, Settings, LogOut, Bell, Search, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { ComponentErrorBoundary } from "@/components/error-boundary"
import { ProfilePlaceholder } from "@/components/real-placeholders"

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "Overview and insights",
  },
  {
    title: "My Items",
    href: "/items",
    icon: Package,
    description: "Manage your wardrobe",
  },
  {
    title: "Outfit Planner",
    href: "/outfit",
    icon: Shirt,
    description: "Create and plan outfits",
    badge: "AI",
  },
  {
    title: "Virtual Closet",
    href: "/virtual-closet",
    icon: Layers,
    description: "3D wardrobe visualization",
    badge: "3D",
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
    description: "Manage your profile",
  },
]

function NavigationContent() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState(3) // Mock notification count

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Don't show navigation on auth pages
  if (pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password") {
    return null
  }

  return (
    <ComponentErrorBoundary>
      <nav className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ClosetAI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn("relative", isActive && "bg-primary text-primary-foreground")}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Search */}
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
              >
                {notifications}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || undefined} alt={user.displayName || "User"} />
                    <AvatarFallback>
                      <ProfilePlaceholder width={32} height={32} />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && <p className="font-medium">{user.displayName}</p>}
                    {user.email && <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>Access all app features and settings</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col space-y-4">
                <div className="flex items-center space-x-2 pb-4 border-b">
                  <div className="h-8 w-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-xl">ClosetAI</span>
                </div>

                {/* Mobile Navigation Items */}
                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    return (
                      <Link key={item.href} href={item.href}>
                        <div
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                            isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{item.title}</span>
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* Mobile User Section */}
                {user && (
                  <div className="pt-4 border-t space-y-2">
                    <Link href="/profile">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </div>
                    </Link>
                    <Link href="/settings">
                      <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors">
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Log out</span>
                    </button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </ComponentErrorBoundary>
  )
}

export default function Navigation() {
  return (
    <ComponentErrorBoundary>
      <NavigationContent />
    </ComponentErrorBoundary>
  )
}
