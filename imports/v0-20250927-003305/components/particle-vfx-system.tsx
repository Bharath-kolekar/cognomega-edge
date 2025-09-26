"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: "neural" | "quantum" | "data"
}

export function ParticleVFXSystem({
  intensity = 50,
  className = "",
}: {
  intensity?: number
  className?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const colors = [
      "rgba(79, 70, 229, 0.8)", // Primary
      "rgba(6, 182, 212, 0.8)", // Secondary
      "rgba(236, 72, 153, 0.8)", // Accent
      "rgba(139, 92, 246, 0.8)", // Purple
      "rgba(34, 197, 94, 0.8)", // Green
    ]

    const createParticle = (x?: number, y?: number): Particle => {
      const types: Particle["type"][] = ["neural", "quantum", "data"]
      return {
        x: x ?? Math.random() * canvas.width,
        y: y ?? Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 0,
        maxLife: Math.random() * 200 + 100,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: types[Math.floor(Math.random() * types.length)],
      }
    }

    // Initialize particles
    for (let i = 0; i < intensity; i++) {
      particlesRef.current.push(createParticle())
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        particle.life++
        particle.x += particle.vx
        particle.y += particle.vy

        // Attract to mouse
        const dx = mousePos.x - particle.x
        const dy = mousePos.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 100) {
          particle.vx += dx * 0.0001
          particle.vy += dy * 0.0001
        }

        // Boundary wrapping
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Calculate alpha based on life
        const alpha = 1 - particle.life / particle.maxLife

        if (alpha <= 0) {
          particlesRef.current[index] = createParticle()
          return
        }

        // Draw particle based on type
        ctx.save()
        ctx.globalAlpha = alpha

        switch (particle.type) {
          case "neural":
            // Neural node
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
            ctx.fillStyle = particle.color
            ctx.fill()

            // Neural connections
            ctx.strokeStyle = particle.color
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x - particle.size * 2, particle.y)
            ctx.lineTo(particle.x + particle.size * 2, particle.y)
            ctx.moveTo(particle.x, particle.y - particle.size * 2)
            ctx.lineTo(particle.x, particle.y + particle.size * 2)
            ctx.stroke()
            break

          case "quantum":
            // Quantum particle with uncertainty
            const uncertainty = Math.sin(particle.life * 0.1) * 2
            ctx.beginPath()
            ctx.arc(particle.x + uncertainty, particle.y + uncertainty, particle.size, 0, Math.PI * 2)
            ctx.fillStyle = particle.color
            ctx.fill()

            // Quantum field
            ctx.beginPath()
            ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
            ctx.strokeStyle = particle.color.replace("0.8", "0.2")
            ctx.lineWidth = 1
            ctx.stroke()
            break

          case "data":
            // Data packet
            const size = particle.size
            ctx.fillStyle = particle.color
            ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size)

            // Data trail
            ctx.strokeStyle = particle.color.replace("0.8", "0.3")
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(particle.x - particle.vx * 5, particle.y - particle.vy * 5)
            ctx.lineTo(particle.x, particle.y)
            ctx.stroke()
            break
        }

        ctx.restore()
      })

      // Draw connections between nearby particles
      ctx.strokeStyle = "rgba(79, 70, 229, 0.1)"
      ctx.lineWidth = 0.5

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i]
          const p2 = particlesRef.current[j]
          const dx = p1.x - p2.x
          const dy = p1.y - p2.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 80) {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [intensity, mousePos])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      onMouseMove={handleMouseMove}
      style={{ zIndex: -1 }}
    />
  )
}
