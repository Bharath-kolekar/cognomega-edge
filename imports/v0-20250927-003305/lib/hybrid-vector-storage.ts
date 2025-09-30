"use client"

import { neon } from "@neondatabase/serverless"

export interface VectorEmbedding {
  id: string
  text: string
  vector: number[]
  metadata: Record<string, any>
  timestamp: number
  usage_count: number
}

export interface VectorSearchResult {
  embedding: VectorEmbedding
  similarity: number
  source: "local" | "database"
}

export interface VectorStorageConfig {
  maxLocalStorage: number // Maximum embeddings to store locally
  similarityThreshold: number // Minimum similarity for search results
  cacheExpiryHours: number // Hours before local cache expires
  batchSize: number // Batch size for database operations
}

class HybridVectorStorage {
  private static instance: HybridVectorStorage
  private sql: any
  private localCache: Map<string, VectorEmbedding>
  private config: VectorStorageConfig
  private isInitialized = false

  constructor() {
    this.localCache = new Map()
    this.config = {
      maxLocalStorage: 1000,
      similarityThreshold: 0.7,
      cacheExpiryHours: 24,
      batchSize: 50,
    }
    if (typeof window !== "undefined") {
      this.initializeStorage()
    } else {
      this.isInitialized = true // Mark as initialized for SSR
    }
  }

  public static getInstance(): HybridVectorStorage {
    if (!HybridVectorStorage.instance) {
      HybridVectorStorage.instance = new HybridVectorStorage()
    }
    return HybridVectorStorage.instance
  }

  private async initializeStorage() {
    try {
      // Initialize Neon connection if DATABASE_URL is available
      if (typeof process !== "undefined" && process.env?.DATABASE_URL) {
        this.sql = neon(process.env.DATABASE_URL)
        await this.createVectorTables()
      }

      // Load cached embeddings from browser storage
      this.loadLocalCache()
      this.isInitialized = true
    } catch (error) {
      console.warn("[v0] Vector storage initialization failed, using local-only mode:", error)
      this.isInitialized = true
    }
  }

  private async createVectorTables() {
    if (!this.sql) return

    try {
      // Create embeddings table with vector support
      await this.sql`
        CREATE TABLE IF NOT EXISTS vector_embeddings (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          vector REAL[] NOT NULL,
          metadata JSONB DEFAULT '{}',
          timestamp BIGINT NOT NULL,
          usage_count INTEGER DEFAULT 1,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `

      // Create index for faster similarity searches
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_vector_embeddings_timestamp 
        ON vector_embeddings(timestamp DESC)
      `

      // Create index for usage-based queries
      await this.sql`
        CREATE INDEX IF NOT EXISTS idx_vector_embeddings_usage 
        ON vector_embeddings(usage_count DESC)
      `
    } catch (error) {
      console.warn("[v0] Failed to create vector tables:", error)
    }
  }

  private loadLocalCache() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      console.warn("[v0] Failed to load local vector cache: localStorage not available")
      return
    }

    try {
      const cached = localStorage.getItem("cognomega_vector_cache")
      if (cached) {
        const data = JSON.parse(cached)
        const now = Date.now()
        const expiryTime = this.config.cacheExpiryHours * 60 * 60 * 1000

        // Load non-expired embeddings
        Object.entries(data).forEach(([id, embedding]: [string, any]) => {
          if (now - embedding.timestamp < expiryTime) {
            this.localCache.set(id, embedding)
          }
        })
      }
    } catch (error) {
      console.warn("[v0] Failed to load local vector cache:", error)
    }
  }

  private saveLocalCache() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return
    }

    try {
      const cacheData: Record<string, VectorEmbedding> = {}

      // Keep only the most frequently used embeddings
      const sortedEmbeddings = Array.from(this.localCache.entries())
        .sort(([, a], [, b]) => b.usage_count - a.usage_count)
        .slice(0, this.config.maxLocalStorage)

      sortedEmbeddings.forEach(([id, embedding]) => {
        cacheData[id] = embedding
      })

      localStorage.setItem("cognomega_vector_cache", JSON.stringify(cacheData))
    } catch (error) {
      console.warn("[v0] Failed to save local vector cache:", error)
    }
  }

  public async storeEmbedding(text: string, vector: number[], metadata: Record<string, any> = {}): Promise<string> {
    const id = this.generateEmbeddingId(text)
    const embedding: VectorEmbedding = {
      id,
      text,
      vector,
      metadata,
      timestamp: Date.now(),
      usage_count: 1,
    }

    // Store locally first (immediate availability)
    this.localCache.set(id, embedding)
    this.saveLocalCache()

    // Store in database asynchronously
    if (this.sql) {
      try {
        await this.sql`
          INSERT INTO vector_embeddings (id, text, vector, metadata, timestamp, usage_count)
          VALUES (${id}, ${text}, ${vector}, ${JSON.stringify(metadata)}, ${embedding.timestamp}, 1)
          ON CONFLICT (id) DO UPDATE SET
            usage_count = vector_embeddings.usage_count + 1,
            timestamp = ${embedding.timestamp}
        `
      } catch (error) {
        console.warn("[v0] Failed to store embedding in database:", error)
      }
    }

    return id
  }

  public async searchSimilar(
    queryVector: number[],
    limit = 10,
    includeLocal = true,
    includeDatabase = true,
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = []

    // Search local cache first (fastest)
    if (includeLocal) {
      for (const [id, embedding] of this.localCache.entries()) {
        const similarity = this.cosineSimilarity(queryVector, embedding.vector)
        if (similarity >= this.config.similarityThreshold) {
          results.push({
            embedding: { ...embedding, usage_count: embedding.usage_count + 1 },
            similarity,
            source: "local",
          })

          // Update usage count
          embedding.usage_count++
        }
      }
    }

    // Search database for additional results
    if (includeDatabase && this.sql && results.length < limit) {
      try {
        const dbEmbeddings = await this.sql`
          SELECT id, text, vector, metadata, timestamp, usage_count
          FROM vector_embeddings
          ORDER BY usage_count DESC, timestamp DESC
          LIMIT ${limit * 2}
        `

        for (const row of dbEmbeddings) {
          // Skip if already in local results
          if (results.some((r) => r.embedding.id === row.id)) continue

          const similarity = this.cosineSimilarity(queryVector, row.vector)
          if (similarity >= this.config.similarityThreshold) {
            results.push({
              embedding: {
                id: row.id,
                text: row.text,
                vector: row.vector,
                metadata: row.metadata,
                timestamp: row.timestamp,
                usage_count: row.usage_count + 1,
              },
              similarity,
              source: "database",
            })

            // Cache frequently accessed embeddings locally
            if (row.usage_count > 5) {
              this.localCache.set(row.id, {
                id: row.id,
                text: row.text,
                vector: row.vector,
                metadata: row.metadata,
                timestamp: row.timestamp,
                usage_count: row.usage_count,
              })
            }
          }
        }
      } catch (error) {
        console.warn("[v0] Database search failed, using local results only:", error)
      }
    }

    // Sort by similarity and limit results
    const sortedResults = results.sort((a, b) => b.similarity - a.similarity).slice(0, limit)

    // Update local cache with usage counts
    this.saveLocalCache()

    return sortedResults
  }

  public async getEmbedding(id: string): Promise<VectorEmbedding | null> {
    // Check local cache first
    const localEmbedding = this.localCache.get(id)
    if (localEmbedding) {
      localEmbedding.usage_count++
      this.saveLocalCache()
      return localEmbedding
    }

    // Check database
    if (this.sql) {
      try {
        const result = await this.sql`
          SELECT id, text, vector, metadata, timestamp, usage_count
          FROM vector_embeddings
          WHERE id = ${id}
        `

        if (result.length > 0) {
          const embedding = result[0]
          const vectorEmbedding: VectorEmbedding = {
            id: embedding.id,
            text: embedding.text,
            vector: embedding.vector,
            metadata: embedding.metadata,
            timestamp: embedding.timestamp,
            usage_count: embedding.usage_count + 1,
          }

          // Cache locally for future access
          this.localCache.set(id, vectorEmbedding)
          this.saveLocalCache()

          return vectorEmbedding
        }
      } catch (error) {
        console.warn("[v0] Failed to retrieve embedding from database:", error)
      }
    }

    return null
  }

  public async deleteEmbedding(id: string): Promise<boolean> {
    let success = false

    // Remove from local cache
    if (this.localCache.has(id)) {
      this.localCache.delete(id)
      this.saveLocalCache()
      success = true
    }

    // Remove from database
    if (this.sql) {
      try {
        await this.sql`DELETE FROM vector_embeddings WHERE id = ${id}`
        success = true
      } catch (error) {
        console.warn("[v0] Failed to delete embedding from database:", error)
      }
    }

    return success
  }

  public async clearCache(): Promise<void> {
    this.localCache.clear()
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("cognomega_vector_cache")
      } catch (error) {
        console.warn("[v0] Failed to clear local cache:", error)
      }
    }
  }

  public async getStorageStats(): Promise<{
    localCount: number
    databaseCount: number
    cacheSize: string
    isOnline: boolean
  }> {
    let databaseCount = 0

    if (this.sql) {
      try {
        const result = await this.sql`SELECT COUNT(*) as count FROM vector_embeddings`
        databaseCount = result[0]?.count || 0
      } catch (error) {
        console.warn("[v0] Failed to get database count:", error)
      }
    }

    const cacheSize = this.calculateCacheSize()

    return {
      localCount: this.localCache.size,
      databaseCount,
      cacheSize,
      isOnline: !!this.sql,
    }
  }

  private generateEmbeddingId(text: string): string {
    // Simple hash function for generating consistent IDs
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `emb_${Math.abs(hash)}_${Date.now()}`
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0

    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i]
      norm1 += vec1[i] * vec1[i]
      norm2 += vec2[i] * vec2[i]
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2)
    return magnitude === 0 ? 0 : dotProduct / magnitude
  }

  private calculateCacheSize(): string {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return "0 B"
    }

    try {
      const cacheData = localStorage.getItem("cognomega_vector_cache")
      if (cacheData) {
        const sizeInBytes = new Blob([cacheData]).size
        if (sizeInBytes < 1024) return `${sizeInBytes} B`
        if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`
        return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`
      }
    } catch (error) {
      console.warn("[v0] Failed to calculate cache size:", error)
    }
    return "0 B"
  }

  public updateConfig(newConfig: Partial<VectorStorageConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  public getConfig(): VectorStorageConfig {
    return { ...this.config }
  }
}

let _hybridVectorStorageInstance: HybridVectorStorage | null = null

export const hybridVectorStorage = new Proxy({} as HybridVectorStorage, {
  get(target, prop) {
    if (!_hybridVectorStorageInstance) {
      _hybridVectorStorageInstance = HybridVectorStorage.getInstance()
    }
    return _hybridVectorStorageInstance[prop as keyof HybridVectorStorage]
  },
})

export async function storeTextEmbedding(
  text: string,
  vector: number[],
  metadata?: Record<string, any>,
): Promise<string> {
  return await hybridVectorStorage.storeEmbedding(text, vector, metadata)
}

export async function searchSimilarTexts(queryVector: number[], limit?: number): Promise<VectorSearchResult[]> {
  return await hybridVectorStorage.searchSimilar(queryVector, limit)
}

export async function getTextEmbedding(id: string): Promise<VectorEmbedding | null> {
  return await hybridVectorStorage.getEmbedding(id)
}

export async function getVectorStorageStats() {
  return await hybridVectorStorage.getStorageStats()
}
