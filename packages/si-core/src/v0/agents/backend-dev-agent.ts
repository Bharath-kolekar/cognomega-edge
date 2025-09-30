/**
 * Backend Development Agent
 * Implements backend APIs, services, and business logic
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, BuildResult, BuildArtifact } from './types';

export class BackendDevAgent extends BaseAgent {
  constructor() {
    super(
      'backend',
      'BackendDevAgent',
      [
        'api-development',
        'rest-api',
        'graphql',
        'authentication',
        'authorization',
        'business-logic',
        'data-validation',
      ],
      7
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing backend dev task: ${task.id}`);

    try {
      const buildResult = await this.buildBackend(task.payload);
      
      return {
        success: buildResult.success,
        data: buildResult,
        metadata: {
          duration: 0,
          confidence: 0.86,
        },
        nextSteps: ['Add validation', 'Implement authentication', 'Add tests'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build backend',
      };
    }
  }

  private async buildBackend(payload: Record<string, unknown>): Promise<BuildResult> {
    const artifacts: BuildArtifact[] = [];

    // Main server file
    artifacts.push({
      name: 'Server',
      type: 'service',
      path: 'src/server.ts',
      content: this.generateServerCode(),
    });

    // API routes
    artifacts.push({
      name: 'Routes',
      type: 'api',
      path: 'src/routes/index.ts',
      content: this.generateRoutes(),
    });

    // Controllers
    artifacts.push({
      name: 'UserController',
      type: 'api',
      path: 'src/controllers/user.controller.ts',
      content: this.generateController(),
    });

    // Services
    artifacts.push({
      name: 'UserService',
      type: 'service',
      path: 'src/services/user.service.ts',
      content: this.generateService(),
    });

    // Middleware
    artifacts.push({
      name: 'AuthMiddleware',
      type: 'service',
      path: 'src/middleware/auth.ts',
      content: this.generateAuthMiddleware(),
    });

    return {
      success: true,
      artifacts,
      timestamp: Date.now(),
    };
  }

  private generateServerCode(): string {
    return `import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes'

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use('/api', routes)

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`)
})

export default app`;
  }

  private generateRoutes(): string {
    return `import { Router } from 'express'
import { UserController } from '../controllers/user.controller'
import { authMiddleware } from '../middleware/auth'

const router = Router()
const userController = new UserController()

router.get('/users', authMiddleware, userController.getUsers)
router.get('/users/:id', authMiddleware, userController.getUserById)
router.post('/users', userController.createUser)
router.put('/users/:id', authMiddleware, userController.updateUser)
router.delete('/users/:id', authMiddleware, userController.deleteUser)

export default router`;
  }

  private generateController(): string {
    return `import { Request, Response } from 'express'
import { UserService } from '../services/user.service'

export class UserController {
  private userService: UserService

  constructor() {
    this.userService = new UserService()
  }

  getUsers = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.getAllUsers()
      res.json(users)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' })
    }
  }

  getUserById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.getUserById(req.params.id)
      if (!user) {
        return res.status(404).json({ error: 'User not found' })
      }
      res.json(user)
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' })
    }
  }

  createUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.createUser(req.body)
      res.status(201).json(user)
    } catch (error) {
      res.status(400).json({ error: 'Failed to create user' })
    }
  }

  updateUser = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.updateUser(req.params.id, req.body)
      res.json(user)
    } catch (error) {
      res.status(400).json({ error: 'Failed to update user' })
    }
  }

  deleteUser = async (req: Request, res: Response) => {
    try {
      await this.userService.deleteUser(req.params.id)
      res.status(204).send()
    } catch (error) {
      res.status(400).json({ error: 'Failed to delete user' })
    }
  }
}`;
  }

  private generateService(): string {
    return `export class UserService {
  async getAllUsers() {
    // Implementation with database
    return []
  }

  async getUserById(id: string) {
    // Implementation with database
    return null
  }

  async createUser(data: any) {
    // Implementation with database
    return data
  }

  async updateUser(id: string, data: any) {
    // Implementation with database
    return data
  }

  async deleteUser(id: string) {
    // Implementation with database
    return true
  }
}`;
  }

  private generateAuthMiddleware(): string {
    return `import { Request, Response, NextFunction } from 'express'

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    // Verify token here
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' })
  }
}`;
  }
}
