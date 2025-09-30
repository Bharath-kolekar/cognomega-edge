"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import NeuralBlob from "./neural-blob" // Import the new NeuralBlob component

export default function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setMousePosition({ x: event.clientX, y: event.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  const parallaxOffset = 20 // Adjust for desired parallax intensity

  return (
    <section className="w-full min-h-screen flex items-center justify-center animate-gradient text-foreground relative overflow-hidden">
      <div className="absolute inset-0 background-pattern opacity-30 animate-background-pulse"></div>
      <NeuralBlob />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full bg-primary/${20 + i * 5} animate-float`}
            style={{
              width: `${1 + i * 0.5}px`,
              height: `${1 + i * 0.5}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              transform: `translate(${
                (mousePosition.x / window.innerWidth - 0.5) * parallaxOffset * (i + 1) * 0.1
              }px, ${(mousePosition.y / window.innerHeight - 0.5) * parallaxOffset * (i + 1) * 0.1}px)`,
              transition: "transform 0.1s ease-out",
            }}
          ></div>
        ))}
      </div>

      <div className="container px-4 md:px-6 relative z-10">
        <div className="flex flex-col items-center space-y-8 text-center animate-fade-in">
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-3xl font-serif font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl text-balance leading-tight drop-shadow-sm animate-text-reveal">
              Unleash Your Vision: The AI Platform for
              <br />
              <span className="text-gradient animate-pulse-glow">Transformative App Creation</span>
            </h1>
            <p
              className="mx-auto max-w-[700px] text-base text-muted-foreground md:text-lg lg:text-xl text-pretty leading-relaxed animate-text-reveal"
              style={{ animationDelay: "0.2s" }}
            >
              Revolutionize development with super intelligence. Craft sophisticated full-stack applications
              effortlessly through intuitive voice commands and natural language.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: "0.4s" }}>
            <Button
              asChild
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 shadow-md animate-shimmer hover:shadow-xl animate-sparkle-in"
            >
              <Link href="#">Begin Your Creation →</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-border text-foreground hover:bg-muted/50 bg-transparent px-8 py-6 text-base font-medium transition-all duration-300 hover:scale-105 shadow-md glass-effect hover:shadow-xl animate-sparkle-in"
              style={{ animationDelay: "0.1s" }}
            >
              <Link href="#">Explore Our AI Models →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
