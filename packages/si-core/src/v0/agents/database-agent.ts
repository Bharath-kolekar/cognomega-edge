/**
 * Database Agent
 * Designs database schemas, migrations, and data access layers
 */

import { BaseAgent } from './base-agent';
import { AgentTask, AgentResult, BuildResult, BuildArtifact, DatabaseDesign } from './types';

export class DatabaseAgent extends BaseAgent {
  constructor() {
    super(
      'database',
      'DatabaseAgent',
      [
        'schema-design',
        'migration-generation',
        'query-optimization',
        'data-modeling',
        'indexing',
      ],
      7
    );
  }

  protected async processTask(task: AgentTask): Promise<AgentResult> {
    this.log('info', `Processing database task: ${task.id}`);

    try {
      const buildResult = await this.buildDatabase(task.payload);
      
      return {
        success: buildResult.success,
        data: buildResult,
        metadata: {
          duration: 0,
          confidence: 0.87,
        },
        nextSteps: ['Run migrations', 'Add indexes', 'Setup connection pool'],
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to build database',
      };
    }
  }

  private async buildDatabase(payload: Record<string, unknown>): Promise<BuildResult> {
    const artifacts: BuildArtifact[] = [];
    const dbType = (payload.databaseType as string) || 'postgresql';

    // Database schema
    artifacts.push({
      name: 'Schema',
      type: 'config',
      path: 'db/schema.sql',
      content: this.generateSchema(dbType),
    });

    // Migration files
    artifacts.push({
      name: 'InitialMigration',
      type: 'config',
      path: 'db/migrations/001_initial.sql',
      content: this.generateInitialMigration(dbType),
    });

    // Database client
    artifacts.push({
      name: 'DatabaseClient',
      type: 'module',
      path: 'src/db/client.ts',
      content: this.generateDatabaseClient(dbType),
    });

    // Models
    artifacts.push({
      name: 'UserModel',
      type: 'module',
      path: 'src/models/user.model.ts',
      content: this.generateModel(),
    });

    return {
      success: true,
      artifacts,
      timestamp: Date.now(),
    };
  }

  private generateSchema(dbType: string): string {
    return `-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Posts table (example)
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_published ON posts(published);`;
  }

  private generateInitialMigration(dbType: string): string {
    return `-- Migration: Initial schema
-- Created: ${new Date().toISOString()}

BEGIN;

${this.generateSchema(dbType)}

COMMIT;`;
  }

  private generateDatabaseClient(dbType: string): string {
    if (dbType === 'postgresql') {
      return `import { Pool } from 'pg'

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'myapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
})

export const query = async (text: string, params?: any[]) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Query error', { text, error })
    throw error
  }
}

export const getClient = async () => {
  const client = await pool.connect()
  return client
}

export default { query, getClient }`;
    }

    return `// Database client implementation for ${dbType}`;
  }

  private generateModel(): string {
    return `import db from '../db/client'

export interface User {
  id: number
  email: string
  name: string
  password_hash: string
  created_at: Date
  updated_at: Date
}

export class UserModel {
  static async findAll(): Promise<User[]> {
    const result = await db.query('SELECT * FROM users ORDER BY created_at DESC')
    return result.rows
  }

  static async findById(id: number): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0] || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows[0] || null
  }

  static async create(data: Partial<User>): Promise<User> {
    const result = await db.query(
      'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [data.email, data.name, data.password_hash]
    )
    return result.rows[0]
  }

  static async update(id: number, data: Partial<User>): Promise<User> {
    const result = await db.query(
      'UPDATE users SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [data.name, id]
    )
    return result.rows[0]
  }

  static async delete(id: number): Promise<boolean> {
    const result = await db.query('DELETE FROM users WHERE id = $1', [id])
    return result.rowCount > 0
  }
}`;
  }
}
