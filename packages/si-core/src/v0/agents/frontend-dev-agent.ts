/**
 * Frontend Development Agent
 * Implements frontend components and features based on UI designs
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, BuildResult, BuildArtifact } from './types';

export class FrontendDevAgent extends BaseAgent {
  constructor() {
    super(
      'frontend',
      'FrontendDevAgent',
      [
        'react-development',
        'vue-development',
        'component-implementation',
        'state-management',
        'routing',
        'styling',
        'api-integration',
      ],
      7
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing frontend dev task: ${task.id}`);

    const { requirements, design, framework } = task.payload;

    if (!requirements) {
      return {
        success: false,
        error: 'Missing requirements',
      };
    }

    try {
      const buildResult = await this.buildFrontend(task.payload);
      
      return {
        success: buildResult.success,
        data: buildResult,
        metadata: {
          duration: 0,
          confidence: 0.88,
          suggestions: [
            'Review component structure',
            'Add prop validation',
            'Implement error boundaries',
          ],
        },
        nextSteps: [
          'Test components',
          'Add unit tests',
          'Optimize bundle size',
        ],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build frontend',
      };
    }
  }

  private async buildFrontend(payload: Record<string, unknown>): Promise<BuildResult> {
    const artifacts: BuildArtifact[] = [];
    const framework = (payload.framework as string) || 'react';

    // Generate main App component
    artifacts.push({
      name: 'App',
      type: 'component',
      path: 'src/App.tsx',
      content: this.generateAppComponent(framework),
      metadata: { framework, type: 'root' },
    });

    // Generate Router setup
    artifacts.push({
      name: 'Router',
      type: 'module',
      path: 'src/routes/index.tsx',
      content: this.generateRouterSetup(framework),
      metadata: { framework, type: 'routing' },
    });

    // Generate components based on design
    if (payload.design) {
      const designComponents = this.generateComponents(payload.design, framework);
      artifacts.push(...designComponents);
    }

    // Generate state management
    artifacts.push({
      name: 'Store',
      type: 'module',
      path: 'src/store/index.ts',
      content: this.generateStateManagement(framework),
      metadata: { framework, type: 'state' },
    });

    // Generate API client
    artifacts.push({
      name: 'API Client',
      type: 'module',
      path: 'src/api/client.ts',
      content: this.generateApiClient(),
      metadata: { type: 'api' },
    });

    // Generate package.json
    artifacts.push({
      name: 'package.json',
      type: 'config',
      path: 'package.json',
      content: this.generatePackageJson(framework, payload.requirements),
      metadata: { type: 'dependencies' },
    });

    return {
      success: true,
      artifacts,
      warnings: [],
      logs: [`Built ${artifacts.length} frontend artifacts`],
      duration: 0,
      timestamp: Date.now(),
    };
  }

  private generateAppComponent(framework: string): string {
    if (framework.toLowerCase().includes('next')) {
      return `import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}`;
    }

    return `import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './routes'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <AppRouter />
      </div>
    </BrowserRouter>
  )
}

export default App`;
  }

  private generateRouterSetup(framework: string): string {
    return `import React from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePage from '../pages/Home'
import AboutPage from '../pages/About'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about" element={<AboutPage />} />
    </Routes>
  )
}`;
  }

  private generateComponents(design: any, framework: string): BuildArtifact[] {
    const artifacts: BuildArtifact[] = [];

    // Generate a sample Button component
    artifacts.push({
      name: 'Button',
      type: 'component',
      path: 'src/components/Button.tsx',
      content: `import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
}) => {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}`,
      metadata: { framework, componentType: 'interactive' },
    });

    // Generate a sample Card component
    artifacts.push({
      name: 'Card',
      type: 'component',
      path: 'src/components/Card.tsx',
      content: `import React from 'react'

interface CardProps {
  title?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ title, children, footer }) => {
  return (
    <div className="card">
      {title && <div className="card-header">{title}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  )
}`,
      metadata: { framework, componentType: 'container' },
    });

    return artifacts;
  }

  private generateStateManagement(framework: string): string {
    // Simple context-based state management
    return `import React, { createContext, useContext, useState, ReactNode } from 'react'

interface AppState {
  user: any | null
  theme: 'light' | 'dark'
}

interface AppContextType {
  state: AppState
  setState: React.Dispatch<React.SetStateAction<AppState>>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>({
    user: null,
    theme: 'light',
  })

  return (
    <AppContext.Provider value={{ state, setState }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppState() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppState must be used within AppProvider')
  }
  return context
}`;
  }

  private generateApiClient(): string {
    return `const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`)
    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`)
    }
    return response.json()
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`)
    }
    return response.json()
  }
}

export const apiClient = new ApiClient(API_BASE_URL)`;
  }

  private generatePackageJson(framework: string, requirements: any): string {
    const dependencies: Record<string, string> = {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
    };

    if (framework.toLowerCase().includes('next')) {
      dependencies['next'] = '^14.0.0';
    } else {
      dependencies['react-router-dom'] = '^6.20.0';
    }

    return JSON.stringify({
      name: requirements?.name || 'cognomega-app',
      version: '0.1.0',
      private: true,
      dependencies,
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        'typescript': '^5.0.0',
      },
      scripts: {
        dev: framework.toLowerCase().includes('next') ? 'next dev' : 'vite',
        build: framework.toLowerCase().includes('next') ? 'next build' : 'vite build',
        start: framework.toLowerCase().includes('next') ? 'next start' : 'vite preview',
      },
    }, null, 2);
  }
}
