import type { Metadata, Viewport } from "next"
import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/contexts/auth-context"
import { ProfileProvider } from "@/contexts/profile-context"
import { ClosetProvider } from "@/contexts/closet-context"
import { OutfitProvider } from "@/contexts/outfit-context"
import { Toaster } from "@/components/ui/sonner"
import { CriticalErrorBoundary, AsyncErrorBoundary } from "@/components/error-boundary"
import Navigation from "@/components/navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ClosetAI - Your AI-Powered Wardrobe Assistant",
  description:
    "Organize your closet, create stunning outfits, and get personalized style recommendations with the power of AI.",
  keywords: ["fashion", "AI", "wardrobe", "outfit planner", "style", "closet organization"],
  authors: [{ name: "ClosetAI Team" }],
  robots: "index, follow",
  openGraph: {
    title: "ClosetAI - Your AI-Powered Wardrobe Assistant",
    description: "Organize your closet, create stunning outfits, and get personalized style recommendations with AI.",
    type: "website",
    locale: "en_US",
  },
  generator: 'v0.dev',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/favicon.ico',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <CriticalErrorBoundary>
          <AsyncErrorBoundary>
              <AuthProvider>
                <ProfileProvider>
                  <ClosetProvider>
                    <OutfitProvider>
                      <Navigation />
                      <main className="min-h-screen">
                        <div className="transition-opacity duration-200">
                          {children}
                        </div>
                      </main>
                      <Toaster />
                    </OutfitProvider>
                  </ClosetProvider>
                </ProfileProvider>
              </AuthProvider>
          </AsyncErrorBoundary>
        </CriticalErrorBoundary>
      </body>
    </html>
  )
}
