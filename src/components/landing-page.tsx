import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shirt, Sparkles, Zap, Cloud, Layers, Heart, ArrowRight, Check } from "lucide-react"

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-background to-muted/50 py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 py-1 px-4 text-sm">
            Introducing ClosetAI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            Your AI-Powered Wardrobe Assistant
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Organize your closet, create stunning outfits, and get personalized style recommendations with the power of
            AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-2">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Manage Your Wardrobe</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              ClosetAI combines powerful organization tools with AI-driven recommendations to transform your style
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Shirt className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Digital Closet</h3>
                <p className="text-muted-foreground">
                  Digitize your entire wardrobe with smart categorization and tagging for easy outfit creation.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Automatic item categorization</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Color and pattern detection</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Smart search and filtering</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-secondary/10 bg-gradient-to-br from-secondary/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">AI Outfit Generator</h3>
                <p className="text-muted-foreground">
                  Get personalized outfit recommendations based on your style, the weather, and upcoming events.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Weather-based suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Occasion-specific outfits</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Style matching algorithms</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-blue-500/10 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">3D Virtual Closet</h3>
                <p className="text-muted-foreground">
                  Visualize your wardrobe in an immersive 3D environment for better organization and planning.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Interactive 3D environment</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Drag-and-drop organization</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Multiple closet templates</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-purple-500/10 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <Cloud className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Weather Integration</h3>
                <p className="text-muted-foreground">
                  Get outfit recommendations based on current and forecasted weather conditions in your location.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Real-time weather data</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Temperature-appropriate suggestions</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Rain and snow preparation</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-pink-500/10 bg-gradient-to-br from-pink-500/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Style Profile</h3>
                <p className="text-muted-foreground">
                  Create your personalized style profile to get recommendations that match your preferences.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Style quiz onboarding</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Color palette preferences</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Fit and pattern preferences</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-green-500/10 bg-gradient-to-br from-green-500/5 to-transparent">
              <CardContent className="p-6 space-y-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Smart Analytics</h3>
                <p className="text-muted-foreground">
                  Gain insights into your wardrobe usage and style patterns to make better fashion decisions.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Most/least worn items</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Color distribution analysis</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <span>Style evolution tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-2">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple Steps to Transform Your Wardrobe</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Getting started with ClosetAI is easy. Follow these simple steps to organize your closet and elevate your
              style.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Create Your Profile</h3>
              <p className="text-muted-foreground">
                Sign up and complete the style quiz to help us understand your preferences and fashion needs.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Add Your Items</h3>
              <p className="text-muted-foreground">
                Upload photos of your clothing items. Our AI will automatically categorize and tag them for you.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Get Recommendations</h3>
              <p className="text-muted-foreground">
                Receive personalized outfit suggestions based on your style, the weather, and upcoming events.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link href="/signup">
                Start Your Style Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-2">Testimonials</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover how ClosetAI has transformed the way people organize their wardrobes and plan their outfits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
                      alt="Emily"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">Emily S.</h4>
                    <p className="text-sm text-muted-foreground">Fashion Blogger</p>
                  </div>
                </div>
                <p className="italic">
                  &quot;ClosetAI has completely changed how I plan my outfits. The weather integration is a game-changer, and
                  I love how it suggests combinations I wouldn&apos;t have thought of!&quot;
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 2 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
                      alt="Michael"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">Michael T.</h4>
                    <p className="text-sm text-muted-foreground">Business Professional</p>
                  </div>
                </div>
                <p className="italic">
                  &quot;As someone who struggles with fashion choices, ClosetAI has been invaluable. I now spend less time
                  deciding what to wear and always look put together.&quot;
                </p>
              </CardContent>
            </Card>

            {/* Testimonial 3 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="mr-4">
                    <Image
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia"
                      alt="Sofia"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold">Sofia L.</h4>
                    <p className="text-sm text-muted-foreground">Student</p>
                  </div>
                </div>
                <p className="italic">
                  &quot;The 3D virtual closet feature is amazing! It&apos;s so much fun to organize my clothes visually, and the
                  outfit recommendations are spot on.&quot;
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Wardrobe?</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of users who have revolutionized their style with ClosetAI. Sign up today and start your
            fashion journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">ClosetAI</h3>
              <p className="text-muted-foreground">Your AI-powered wardrobe assistant for smarter style decisions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Digital Closet</li>
                <li>AI Outfit Generator</li>
                <li>3D Virtual Closet</li>
                <li>Weather Integration</li>
                <li>Style Profile</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>Help Center</li>
                <li>Style Guide</li>
                <li>API Documentation</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Contact</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} ClosetAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
