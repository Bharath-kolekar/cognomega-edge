/**
 * Testing Agent
 * Generates and executes tests for the application
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, BuildResult, BuildArtifact } from './types';

export class TestingAgent extends BaseAgent {
  constructor() {
    super(
      'testing',
      'TestingAgent',
      [
        'unit-testing',
        'integration-testing',
        'e2e-testing',
        'test-generation',
        'code-coverage',
      ],
      6
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing testing task: ${task.id}`);

    try {
      const buildResult = await this.generateTests(task.payload);
      
      return {
        success: buildResult.success,
        data: buildResult,
        metadata: {
          duration: 0,
          confidence: 0.82,
        },
        nextSteps: ['Run tests', 'Check coverage', 'Fix failing tests'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate tests',
      };
    }
  }

  private async generateTests(payload: Record<string, unknown>): Promise<BuildResult> {
    const artifacts: BuildArtifact[] = [];

    // Test configuration
    artifacts.push({
      name: 'Jest Config',
      type: 'config',
      path: 'jest.config.js',
      content: this.generateJestConfig(),
    });

    // Unit tests
    artifacts.push({
      name: 'UserService Test',
      type: 'module',
      path: 'src/services/__tests__/user.service.test.ts',
      content: this.generateUnitTest(),
    });

    // Integration tests
    artifacts.push({
      name: 'API Integration Test',
      type: 'module',
      path: 'src/__tests__/api.integration.test.ts',
      content: this.generateIntegrationTest(),
    });

    // Test utilities
    artifacts.push({
      name: 'Test Utils',
      type: 'module',
      path: 'src/__tests__/utils/test-helpers.ts',
      content: this.generateTestUtils(),
    });

    return {
      success: true,
      artifacts,
      timestamp: Date.now(),
    };
  }

  private generateJestConfig(): string {
    return `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
};`;
  }

  private generateUnitTest(): string {
    return `import { UserService } from '../user.service'

describe('UserService', () => {
  let userService: UserService

  beforeEach(() => {
    userService = new UserService()
  })

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = await userService.getAllUsers()
      expect(Array.isArray(users)).toBe(true)
    })
  })

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const userId = '1'
      const user = await userService.getUserById(userId)
      expect(user).toBeDefined()
    })

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById('999')
      expect(user).toBeNull()
    })
  })

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }
      const user = await userService.createUser(userData)
      expect(user).toHaveProperty('id')
      expect(user.email).toBe(userData.email)
    })

    it('should throw error for invalid data', async () => {
      await expect(userService.createUser({})).rejects.toThrow()
    })
  })
})`;
  }

  private generateIntegrationTest(): string {
    return `import request from 'supertest'
import app from '../server'

describe('API Integration Tests', () => {
  describe('GET /api/users', () => {
    it('should return 200 and list of users', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200)
      
      expect(Array.isArray(response.body)).toBe(true)
    })
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123',
      }

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('id')
      expect(response.body.email).toBe(userData.email)
    })

    it('should return 400 for invalid data', async () => {
      await request(app)
        .post('/api/users')
        .send({})
        .expect(400)
    })
  })

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      const response = await request(app)
        .get('/api/users/1')
        .expect(200)

      expect(response.body).toHaveProperty('id')
    })

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/999999')
        .expect(404)
    })
  })
})`;
  }

  private generateTestUtils(): string {
    return `export const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  created_at: new Date(),
  updated_at: new Date(),
}

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
})

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const mockDatabase = {
  query: jest.fn(),
  getClient: jest.fn(),
}`;
  }
}
