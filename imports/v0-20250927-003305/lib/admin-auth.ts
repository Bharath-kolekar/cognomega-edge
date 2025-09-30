interface AdminUser {
  id: string
  username: string
  role: "admin" | "super_admin"
  permissions: string[]
  lastLogin: number
}

interface AdminSession {
  user: AdminUser
  token: string
  expiresAt: number
}

class AdminAuthManager {
  private session: AdminSession | null = null
  private readonly ADMIN_CREDENTIALS = {
    admin: "admin123", // In production, this would be hashed and stored securely
    superadmin: "super456",
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSession()
    }
  }

  private loadSession() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return
    }

    try {
      const stored = localStorage.getItem("admin_session")
      if (stored) {
        const session = JSON.parse(stored) as AdminSession
        if (session.expiresAt > Date.now()) {
          this.session = session
        } else {
          this.clearSession()
        }
      }
    } catch (error) {
      console.error("Failed to load admin session:", error)
      this.clearSession()
    }
  }

  private saveSession() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return
    }

    if (this.session) {
      localStorage.setItem("admin_session", JSON.stringify(this.session))
    }
  }

  private clearSession() {
    this.session = null
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.removeItem("admin_session")
    }
  }

  async login(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const normalizedUsername = username.toLowerCase()

    if (normalizedUsername === "admin" && password === this.ADMIN_CREDENTIALS.admin) {
      this.session = {
        user: {
          id: "admin-1",
          username: "admin",
          role: "admin",
          permissions: ["view_feedback", "view_history", "manage_voice", "export_data"],
          lastLogin: Date.now(),
        },
        token: this.generateToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }
      this.saveSession()
      return { success: true }
    } else if (normalizedUsername === "superadmin" && password === this.ADMIN_CREDENTIALS.superadmin) {
      this.session = {
        user: {
          id: "admin-2",
          username: "superadmin",
          role: "super_admin",
          permissions: [
            "view_feedback",
            "view_history",
            "manage_voice",
            "export_data",
            "manage_users",
            "system_config",
          ],
          lastLogin: Date.now(),
        },
        token: this.generateToken(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }
      this.saveSession()
      return { success: true }
    }

    return { success: false, error: "Invalid credentials" }
  }

  logout() {
    this.clearSession()
  }

  isAuthenticated(): boolean {
    return this.session !== null && this.session.expiresAt > Date.now()
  }

  getCurrentUser(): AdminUser | null {
    return this.session?.user || null
  }

  hasPermission(permission: string): boolean {
    return this.session?.user.permissions.includes(permission) || false
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Check if user has access to specific admin features
  canViewFeedback(): boolean {
    return this.hasPermission("view_feedback")
  }

  canViewHistory(): boolean {
    return this.hasPermission("view_history")
  }

  canManageVoice(): boolean {
    return this.hasPermission("manage_voice")
  }

  canExportData(): boolean {
    return this.hasPermission("export_data")
  }

  canManageUsers(): boolean {
    return this.hasPermission("manage_users")
  }

  canConfigureSystem(): boolean {
    return this.hasPermission("system_config")
  }
}

let adminAuthInstance: AdminAuthManager | null = null

export const adminAuth = {
  get instance(): AdminAuthManager {
    if (!adminAuthInstance) {
      adminAuthInstance = new AdminAuthManager()
    }
    return adminAuthInstance
  },

  // Proxy all methods to the singleton instance
  login: (username: string, password: string) => adminAuth.instance.login(username, password),
  logout: () => adminAuth.instance.logout(),
  isAuthenticated: () => adminAuth.instance.isAuthenticated(),
  getCurrentUser: () => adminAuth.instance.getCurrentUser(),
  hasPermission: (permission: string) => adminAuth.instance.hasPermission(permission),
  canViewFeedback: () => adminAuth.instance.canViewFeedback(),
  canViewHistory: () => adminAuth.instance.canViewHistory(),
  canManageVoice: () => adminAuth.instance.canManageVoice(),
  canExportData: () => adminAuth.instance.canExportData(),
  canManageUsers: () => adminAuth.instance.canManageUsers(),
  canConfigureSystem: () => adminAuth.instance.canConfigureSystem(),
}

export type { AdminUser, AdminSession }
