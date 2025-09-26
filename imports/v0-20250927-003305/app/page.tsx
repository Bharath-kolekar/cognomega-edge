"use client"

import { Button } from "@/components/ui/button"

export default function HomePage() {
  console.log("[v0] Minimal HomePage rendering")

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-4xl font-bold mb-4">Cognomega</h1>
      <p className="text-lg text-muted-foreground mb-6">Voice AI Platform</p>
      <Button onClick={() => alert("Button works!")}>Test Button</Button>
    </div>
  )
}
