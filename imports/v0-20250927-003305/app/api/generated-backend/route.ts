import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Initialize Neon connection with the provided database URL
const sql = neon(
  process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_I6TfXo7jJcgG@ep-green-silence-a1no9bjl.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
)

export async function GET(request: NextRequest) {
  try {
    // Initialize vector embeddings table if it doesn't exist
    await sql`
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

    // Create indexes for better performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_timestamp 
      ON vector_embeddings(timestamp DESC)
    `

    await sql`
      CREATE INDEX IF NOT EXISTS idx_vector_embeddings_usage 
      ON vector_embeddings(usage_count DESC)
    `

    // Get database stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_embeddings,
        MAX(created_at) as last_created,
        AVG(usage_count) as avg_usage
      FROM vector_embeddings
    `

    return NextResponse.json({
      status: "connected",
      database: "neon",
      tables_initialized: true,
      stats: stats[0] || { total_embeddings: 0, last_created: null, avg_usage: 0 },
    })
  } catch (error) {
    console.error("[v0] Database initialization error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to initialize database",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case "store_embedding":
        const { id, text, vector, metadata } = data
        await sql`
          INSERT INTO vector_embeddings (id, text, vector, metadata, timestamp, usage_count)
          VALUES (${id}, ${text}, ${vector}, ${JSON.stringify(metadata || {})}, ${Date.now()}, 1)
          ON CONFLICT (id) DO UPDATE SET
            usage_count = vector_embeddings.usage_count + 1,
            timestamp = ${Date.now()}
        `
        return NextResponse.json({ success: true, id })

      case "search_similar":
        const { limit = 10 } = data
        const embeddings = await sql`
          SELECT id, text, vector, metadata, timestamp, usage_count
          FROM vector_embeddings
          ORDER BY usage_count DESC, timestamp DESC
          LIMIT ${limit}
        `
        return NextResponse.json({ embeddings })

      case "get_stats":
        const statsResult = await sql`
          SELECT 
            COUNT(*) as total_embeddings,
            MAX(created_at) as last_created,
            AVG(usage_count) as avg_usage,
            SUM(usage_count) as total_usage
          FROM vector_embeddings
        `
        return NextResponse.json({ stats: statsResult[0] })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] API error:", error)
    return NextResponse.json(
      {
        error: "Database operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
