"use client"

import { LayoutDashboard, Plus, Settings, Shirt, User2, Sparkles, User, Layers, BarChart3 } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ReactNode } from "react"
import { usePathname } from "next/navigation"

interface DashboardLayoutProps {
  children: ReactNode
}

const links = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/usage",
    label: "Usage",
    icon: BarChart3,
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    icon: Settings,
  },
]

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute left-4 top-4 md:hidden">
            <LayoutDashboard className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-xs">
          <ScrollArea className="py-6">
            <DashboardSidebarMobile />
          </ScrollArea>
        </SheetContent>
      </Sheet>
      <div className="hidden border-r md:block">
        <aside className="fixed left-0 top-0 z-20 h-full w-64 bg-background py-6">
          <DashboardSidebar />
        </aside>
      </div>
      <main className="md:pl-64">{children}</main>
    </div>
  )
}

function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-4">
      <Link href="/" className="flex items-center space-x-2 px-4">
        <Avatar>
          <AvatarImage src="/avatars/avatar1.png" alt="Avatar" />
          <AvatarFallback>NU</AvatarFallback>
        </Avatar>
        <span className="font-bold">ClosetAI</span>
      </Link>
      <Separator />
      <div className="flex flex-col space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
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

function DashboardSidebarMobile() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-4">
      <Link href="/" className="flex items-center space-x-2 px-4">
        <Avatar>
          <AvatarImage src="/avatars/avatar1.png" alt="Avatar" />
          <AvatarFallback>NU</AvatarFallback>
        </Avatar>
        <span className="font-bold">ClosetAI</span>
      </Link>
      <Separator />
      <div className="flex flex-col space-y-1">
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
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
