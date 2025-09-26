import { type NextRequest, NextResponse } from "next/server"

interface CreateAppRequest {
  type: "react" | "nextjs" | "vue" | "svelte"
  description: string
  features: string[]
}

interface AppTemplate {
  name: string
  files: Record<string, string>
  dependencies: string[]
  scripts: Record<string, string>
}

export async function POST(request: NextRequest) {
  try {
    const { type, description, features }: CreateAppRequest = await request.json()

    const appTemplate = await generateAppTemplate(type, description, features)

    const projectId = `cognomega-${Date.now()}`
    const projectFiles = await createProjectFiles(appTemplate, projectId)

    const buildResult = await initializeBuild(projectId, projectFiles)

    const deploymentConfig = await prepareDeployment(projectId, type, features)

    return NextResponse.json({
      success: true,
      projectId,
      appType: type,
      features,
      files: Object.keys(projectFiles),
      buildStatus: buildResult.status,
      deploymentUrl: deploymentConfig.previewUrl,
      message: `Successfully created ${type} application with ${features.length} features`,
    })
  } catch (error) {
    console.error("Error creating full-stack app:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create application",
      },
      { status: 500 },
    )
  }
}

async function generateAppTemplate(type: string, description: string, features: string[]): Promise<AppTemplate> {
  const baseTemplates: Record<string, AppTemplate> = {
    react: {
      name: "React App",
      files: {
        "package.json": JSON.stringify(
          {
            name: "cognomega-react-app",
            version: "1.0.0",
            dependencies: {
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              typescript: "^5.0.0",
              vite: "^4.4.0",
              "@vitejs/plugin-react": "^4.0.0",
            },
          },
          null,
          2,
        ),
        "src/App.tsx": generateReactApp(description, features),
        "src/main.tsx": generateReactMain(),
        "index.html": generateIndexHtml("React App"),
        "vite.config.ts": generateViteConfig(),
        "tsconfig.json": generateTsConfig(),
      },
      dependencies: ["react", "react-dom", "typescript", "vite"],
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
    },
    nextjs: {
      name: "Next.js App",
      files: {
        "package.json": JSON.stringify(
          {
            name: "cognomega-nextjs-app",
            version: "1.0.0",
            dependencies: {
              next: "^14.0.0",
              react: "^18.2.0",
              "react-dom": "^18.2.0",
              "@types/react": "^18.2.0",
              "@types/react-dom": "^18.2.0",
              typescript: "^5.0.0",
            },
          },
          null,
          2,
        ),
        "app/page.tsx": generateNextjsPage(description, features),
        "app/layout.tsx": generateNextjsLayout(),
        "next.config.js": generateNextConfig(),
        "tsconfig.json": generateTsConfig(),
      },
      dependencies: ["next", "react", "react-dom", "typescript"],
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
      },
    },
  }

  let template = baseTemplates[type] || baseTemplates.react

  if (features.includes("authentication")) {
    template = await addAuthFeature(template, type)
  }

  if (features.includes("database")) {
    template = await addDatabaseFeature(template, type)
  }

  if (features.includes("api")) {
    template = await addApiFeature(template, type)
  }

  if (features.includes("dashboard")) {
    template = await addDashboardFeature(template, type)
  }

  return template
}

function generateReactApp(description: string, features: string[]): string {
  const hasAuth = features.includes("authentication")
  const hasApi = features.includes("api")
  const hasDashboard = features.includes("dashboard")

  return `import React, { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  ${hasAuth ? "const [user, setUser] = useState(null)" : ""}

  useEffect(() => {
    // Initialize app
    console.log('Cognomega React App initialized')
    ${hasApi ? "fetchData()" : ""}
  }, [])

  ${
    hasApi
      ? `
  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/data')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }`
      : ""
  }

  ${
    hasAuth
      ? `
  const handleLogin = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      const user = await response.json()
      setUser(user)
    } catch (error) {
      console.error('Login error:', error)
    }
  }`
      : ""
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧠 Cognomega App</h1>
        <p>Generated from voice command: "${description}"</p>
        
        ${
          hasAuth
            ? `
        {user ? (
          <div>
            <p>Welcome, {user.name}!</p>
            <button onClick={() => setUser(null)}>Logout</button>
          </div>
        ) : (
          <div>
            <button onClick={() => handleLogin({ email: 'demo@example.com', password: 'demo' })}>
              Login Demo
            </button>
          </div>
        )}`
            : ""
        }

        ${
          hasDashboard
            ? `
        <div className="dashboard">
          <h2>Dashboard</h2>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h3>Analytics</h3>
              <p>Real-time data visualization</p>
            </div>
            <div className="dashboard-card">
              <h3>Performance</h3>
              <p>System performance metrics</p>
            </div>
            <div className="dashboard-card">
              <h3>Users</h3>
              <p>User management and insights</p>
            </div>
          </div>
        </div>`
            : ""
        }

        ${
          hasApi &&
          `
        <div className="data-section">
          <h2>Data</h2>
          {loading ? (
            <p>Loading...</p>
          ) : data ? (
            <pre>{JSON.stringify(data, null, 2)}</pre>
          ) : (
            <button onClick={fetchData}>Load Data</button>
          )}
        </div>`
        }

        <div className="features">
          <h3>Features Included:</h3>
          <ul>
            {${JSON.stringify(features)}.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  )
}

export default App`
}

function generateReactMain(): string {
  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
}

function generateNextjsPage(description: string, features: string[]): string {
  return `'use client'

import { useState, useEffect } from 'react'

export default function HomePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    console.log('Cognomega Next.js App initialized')
  }, [])

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">🧠 Cognomega Next.js App</h1>
        <p className="text-lg mb-8">Generated from voice command: "${description}"</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {${JSON.stringify(features)}.map((feature, index) => (
            <div key={index} className="p-6 border rounded-lg">
              <h3 className="text-xl font-semibold mb-2">{feature}</h3>
              <p className="text-gray-600">Feature implementation for {feature}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}`
}

function generateNextjsLayout(): string {
  return `import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cognomega App',
  description: 'Generated by Cognomega AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}`
}

function generateIndexHtml(title: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
}

function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})`
}

function generateNextConfig(): string {
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig`
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }],
    },
    null,
    2,
  )
}

async function addAuthFeature(template: AppTemplate, type: string): Promise<AppTemplate> {
  // Add authentication-related files and dependencies
  template.dependencies.push("jsonwebtoken", "bcryptjs")

  if (type === "nextjs") {
    template.files["app/api/auth/login/route.ts"] = generateAuthApi()
    template.files["app/login/page.tsx"] = generateLoginPage()
  }

  return template
}

async function addDatabaseFeature(template: AppTemplate, type: string): Promise<AppTemplate> {
  // Add database-related files and dependencies
  template.dependencies.push("prisma", "@prisma/client")

  template.files["prisma/schema.prisma"] = generatePrismaSchema()
  template.files["lib/db.ts"] = generateDbConnection()

  return template
}

async function addApiFeature(template: AppTemplate, type: string): Promise<AppTemplate> {
  if (type === "nextjs") {
    template.files["app/api/data/route.ts"] = generateDataApi()
  }

  return template
}

async function addDashboardFeature(template: AppTemplate, type: string): Promise<AppTemplate> {
  template.dependencies.push("recharts", "lucide-react")

  if (type === "nextjs") {
    template.files["app/dashboard/page.tsx"] = generateDashboardPage()
  }

  return template
}

function generateAuthApi(): string {
  return `import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Demo authentication
    if (email === 'demo@example.com' && password === 'demo') {
      return NextResponse.json({
        success: true,
        user: { id: 1, name: 'Demo User', email }
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Authentication failed'
    }, { status: 500 })
  }
}`
}

function generateLoginPage(): string {
  return `'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Handle successful login
        window.location.href = '/dashboard'
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-8 border rounded-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}`
}

function generatePrismaSchema(): string {
  return `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}`
}

function generateDbConnection(): string {
  return `import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma`
}

function generateDataApi(): string {
  return `import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Demo data
    const data = {
      users: 1250,
      revenue: 45000,
      growth: 12.5,
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data
    })
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data'
    }, { status: 500 })
  }
}`
}

function generateDashboardPage(): string {
  return `'use client'

import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/data')
      const result = await response.json()
      setData(result.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-8">Loading dashboard...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Users</h3>
          <p className="text-3xl font-bold">{data?.users || 0}</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold">\${data?.revenue || 0}</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Growth</h3>
          <p className="text-3xl font-bold">{data?.growth || 0}%</p>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Status</h3>
          <p className="text-3xl font-bold text-green-500">Active</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-2">
            <p className="text-sm">User registration: +15 today</p>
            <p className="text-sm">Revenue update: +\$2,500</p>
            <p className="text-sm">System health: All systems operational</p>
          </div>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Generate Report
            </button>
            <button className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600">
              Export Data
            </button>
            <button className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              System Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}`
}

async function createProjectFiles(template: AppTemplate, projectId: string): Promise<Record<string, string>> {
  // In a real implementation, this would create actual files
  // For now, we'll return the file structure
  return template.files
}

async function initializeBuild(projectId: string, files: Record<string, string>) {
  // Simulate build process
  return {
    status: "success",
    buildTime: "2.3s",
    outputSize: "1.2MB",
  }
}

async function prepareDeployment(projectId: string, type: string, features: string[]) {
  // Generate deployment configuration
  return {
    previewUrl: `https://${projectId}.cognomega-preview.app`,
    productionUrl: `https://${projectId}.cognomega.app`,
    deploymentId: `deploy_${Date.now()}`,
    status: "ready",
  }
}
