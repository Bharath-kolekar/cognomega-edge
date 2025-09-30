"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const AdminLogin = dynamic(() => import("@/components/admin-login").then((mod) => ({ default: mod.AdminLogin })), {
  ssr: false,
})
const AdminDashboard = dynamic(
  () => import("@/components/admin-dashboard").then((mod) => ({ default: mod.AdminDashboard })),
  { ssr: false },
)

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    import("@/lib/admin-auth").then(({ adminAuth }) => {
      setIsAuthenticated(adminAuth.isAuthenticated())
      setIsLoading(false)
    })
  }, [])

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
  }

  const handleLogout = () => {
    import("@/lib/admin-auth").then(({ adminAuth }) => {
      adminAuth.logout()
      setIsAuthenticated(false)
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return <AdminDashboard onLogout={handleLogout} />
}
