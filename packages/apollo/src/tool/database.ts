import z from "zod"
import { Tool } from "./tool"
import path from "path"
import DESCRIPTION from "./database.txt"
import { Log } from "../util/log"
import { Credentials } from "./credentials"
import { Instance } from "../project/instance"

const log = Log.create({ service: "database-tool" })

/**
 * Database connection cache.
 */
interface DatabaseConnection {
  type: "postgres" | "mysql" | "sqlite" | "mongodb" | "redis"
  client: any
  createdAt: number
}

const connections = new Map<string, DatabaseConnection>()

/**
 * Close a database connection.
 */
async function closeConnection(name: string): Promise<void> {
  const conn = connections.get(name)
  if (!conn) return

  try {
    switch (conn.type) {
      case "postgres":
      case "mysql":
        await conn.client.end?.()
        break
      case "mongodb":
        await conn.client.close?.()
        break
      case "redis":
        await conn.client.quit?.()
        break
      case "sqlite":
        // Fixed: Await is not needed for synchronous better-sqlite3 close, but ensure it's called
        conn.client.close?.()
        break
    }
  } catch (e) {
    log.warn("Error closing connection", { name, error: e })
  }

  connections.delete(name)
}

/**
 * Close all connections.
 */
async function closeAllConnections(): Promise<void> {
  for (const name of connections.keys()) {
    await closeConnection(name)
  }
}

/**
 * Connect to PostgreSQL database.
 */
async function connectPostgres(config: {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  ssl?: boolean
}): Promise<any> {
  // @ts-ignore - pg types may not be installed
  const pg = await import("pg").catch(() => null)
  if (!pg) {
    throw new Error("PostgreSQL requires 'pg' package. Install with: npm install pg")
  }

  const client = new pg.default.Client({
    connectionString: config.connectionString,
    host: config.host,
    port: config.port || 5432,
    database: config.database,
    user: config.user,
    password: config.password,
    // Enable TLS with proper certificate validation (rejectUnauthorized defaults to true)
    ssl: config.ssl ? { rejectUnauthorized: true } : undefined,
  })

  await client.connect()
  return client
}

/**
 * Connect to MySQL database.
 */
async function connectMysql(config: {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
}): Promise<any> {
  const mysql = await import("mysql2/promise").catch(() => null)
  if (!mysql) {
    throw new Error("MySQL requires 'mysql2' package. Install with: npm install mysql2")
  }

  if (config.connectionString) {
    return mysql.createConnection(config.connectionString)
  }

  return mysql.createConnection({
    host: config.host || "localhost",
    port: config.port || 3306,
    database: config.database,
    user: config.user,
    password: config.password,
  })
}

/**
 * Connect to SQLite database.
 */
async function connectSqlite(filepath: string): Promise<any> {
  // @ts-ignore - better-sqlite3 types may not be installed
  const sqlite = await import("better-sqlite3").catch(() => null)
  if (!sqlite) {
    throw new Error("SQLite requires 'better-sqlite3' package. Install with: npm install better-sqlite3")
  }

  const dbPath = path.isAbsolute(filepath) ? filepath : path.resolve(Instance.directory, filepath)
  return new sqlite.default(dbPath)
}

/**
 * Connect to MongoDB.
 */
async function connectMongodb(config: {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
}): Promise<any> {
  const mongodb = await import("mongodb").catch(() => null)
  if (!mongodb) {
    throw new Error("MongoDB requires 'mongodb' package. Install with: npm install mongodb")
  }

  let uri = config.connectionString
  if (!uri) {
    // URL-encode user and password to handle special characters like @, /, ?, #
    const auth = config.user
      ? `${encodeURIComponent(config.user)}:${encodeURIComponent(config.password || "")}@`
      : ""
    uri = `mongodb://${auth}${config.host || "localhost"}:${config.port || 27017}/${config.database || ""}`
  }

  const client = new mongodb.MongoClient(uri)
  await client.connect()
  return client
}

/**
 * Connect to Redis.
 */
async function connectRedis(config: {
  connectionString?: string
  host?: string
  port?: number
  password?: string
  db?: number
}): Promise<any> {
  const redis = await import("ioredis").catch(() => null)
  if (!redis) {
    throw new Error("Redis requires 'ioredis' package. Install with: npm install ioredis")
  }

  if (config.connectionString) {
    return new redis.default(config.connectionString)
  }

  return new redis.default({
    host: config.host || "localhost",
    port: config.port || 6379,
    password: config.password,
    db: config.db || 0,
  })
}

/**
 * Execute SQL query (PostgreSQL/MySQL/SQLite).
 */
async function executeQuery(
  conn: DatabaseConnection,
  sql: string,
  params?: any[]
): Promise<{ rows: any[]; rowCount: number }> {
  switch (conn.type) {
    case "postgres": {
      const result = await conn.client.query(sql, params)
      return { rows: result.rows, rowCount: result.rowCount || result.rows.length }
    }
    case "mysql": {
      const [rows] = await conn.client.execute(sql, params)
      return { rows: Array.isArray(rows) ? rows : [], rowCount: Array.isArray(rows) ? rows.length : 0 }
    }
    case "sqlite": {
      // Check if it's a SELECT query
      if (sql.trim().toLowerCase().startsWith("select")) {
        const stmt = conn.client.prepare(sql)
        const rows = params ? stmt.all(...params) : stmt.all()
        return { rows, rowCount: rows.length }
      } else {
        const stmt = conn.client.prepare(sql)
        const result = params ? stmt.run(...params) : stmt.run()
        return { rows: [], rowCount: result.changes }
      }
    }
    default:
      throw new Error(`Query not supported for ${conn.type}`)
  }
}

/**
 * Validate identifier (table/column names) to prevent SQL injection.
 * Only allows alphanumeric characters and underscores.
 */
function validateIdentifier(name: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid identifier: "${name}". Only alphanumeric characters and underscores are allowed.`)
  }
  // Double-quote escape for safety (works in PostgreSQL, SQLite, MySQL with ANSI_QUOTES)
  return name.replace(/"/g, '""')
}

/**
 * Get database schema/structure.
 */
async function getSchema(
  conn: DatabaseConnection,
  table?: string
): Promise<any> {
  switch (conn.type) {
    case "postgres": {
      if (table) {
        const result = await conn.client.query(
          `SELECT column_name, data_type, is_nullable, column_default
           FROM information_schema.columns
           WHERE table_name = $1
           ORDER BY ordinal_position`,
          [table]
        )
        return result.rows
      }
      const result = await conn.client.query(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = 'public'
         ORDER BY table_name`
      )
      return result.rows.map((r: any) => r.table_name)
    }
    case "mysql": {
      if (table) {
        // Validate table name to prevent SQL injection
        const safeName = validateIdentifier(table)
        const [rows] = await conn.client.execute(`DESCRIBE \`${safeName}\``)
        return rows
      }
      const [rows] = await conn.client.execute("SHOW TABLES")
      return rows.map((r: any) => Object.values(r)[0])
    }
    case "sqlite": {
      if (table) {
        // Validate table name to prevent SQL injection
        const safeName = validateIdentifier(table)
        const result = conn.client.prepare(`PRAGMA table_info("${safeName}")`).all()
        return result
      }
      const result = conn.client
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all()
      return result.map((r: any) => r.name)
    }
    case "mongodb": {
      const db = conn.client.db()
      if (table) {
        // Get sample document to infer schema
        const collection = db.collection(table)
        const sample = await collection.findOne()
        return sample ? Object.keys(sample) : []
      }
      const collections = await db.listCollections().toArray()
      return collections.map((c: any) => c.name)
    }
    case "redis": {
      // Redis doesn't have a schema, return key patterns
      const keys = await conn.client.keys("*")
      return keys.slice(0, 100) // Limit to 100 keys
    }
    default:
      throw new Error(`Schema not supported for ${conn.type}`)
  }
}

/**
 * Execute MongoDB operation.
 */
async function executeMongodb(
  conn: DatabaseConnection,
  collection: string,
  operation: string,
  params: any
): Promise<any> {
  const db = conn.client.db()
  const coll = db.collection(collection)

  switch (operation) {
    case "find":
      return await coll.find(params.filter || {}).limit(params.limit || 100).toArray()
    case "findOne":
      return await coll.findOne(params.filter || {})
    case "insertOne":
      return await coll.insertOne(params.document)
    case "insertMany":
      return await coll.insertMany(params.documents)
    case "updateOne":
      return await coll.updateOne(params.filter, params.update)
    case "updateMany":
      return await coll.updateMany(params.filter, params.update)
    case "deleteOne":
      return await coll.deleteOne(params.filter)
    case "deleteMany":
      return await coll.deleteMany(params.filter)
    case "count":
      return await coll.countDocuments(params.filter || {})
    case "aggregate":
      return await coll.aggregate(params.pipeline).toArray()
    default:
      throw new Error(`Unknown MongoDB operation: ${operation}`)
  }
}

/**
 * Allowed Redis commands whitelist to prevent arbitrary method execution.
 */
const ALLOWED_REDIS_COMMANDS = new Set([
  // String commands
  "get", "set", "mget", "mset", "incr", "decr", "incrby", "decrby", "append", "strlen", "getrange", "setrange", "setnx", "setex", "psetex", "getset",
  // Hash commands
  "hget", "hset", "hmget", "hmset", "hdel", "hexists", "hgetall", "hincrby", "hincrbyfloat", "hkeys", "hvals", "hlen", "hsetnx",
  // List commands
  "lpush", "rpush", "lpop", "rpop", "lrange", "llen", "lindex", "lset", "linsert", "lrem", "ltrim",
  // Set commands
  "sadd", "srem", "smembers", "sismember", "scard", "sdiff", "sinter", "sunion", "spop", "srandmember",
  // Sorted set commands
  "zadd", "zrem", "zscore", "zrank", "zrevrank", "zrange", "zrevrange", "zrangebyscore", "zcard", "zcount", "zincrby",
  // Key commands
  "del", "exists", "expire", "expireat", "ttl", "pttl", "persist", "keys", "scan", "type", "rename", "renamenx",
  // Other common commands
  "ping", "echo", "dbsize", "info", "time", "flushdb", "flushall"
])

/**
 * Execute Redis command.
 */
async function executeRedis(
  conn: DatabaseConnection,
  command: string,
  args: any[]
): Promise<any> {
  const cmd = command.toLowerCase()

  // Validate command against whitelist to prevent arbitrary method execution
  if (!ALLOWED_REDIS_COMMANDS.has(cmd)) {
    throw new Error(`Redis command "${command}" is not allowed. Allowed commands: ${Array.from(ALLOWED_REDIS_COMMANDS).slice(0, 20).join(", ")}...`)
  }

  // Safely call the command as a method
  const method = conn.client[cmd]
  if (typeof method !== "function") {
    throw new Error(`Redis command "${command}" is not available on this client`)
  }

  return await method.call(conn.client, ...args)
}

export const DatabaseTool = Tool.define("database", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      action: z
        .enum(["connect", "query", "execute", "schema", "mongodb", "redis", "disconnect"])
        .describe("Database action to perform"),

      // Connection
      name: z
        .string()
        .optional()
        .default("default")
        .describe("Connection name for caching/reuse"),
      type: z
        .enum(["postgres", "mysql", "sqlite", "mongodb", "redis"])
        .optional()
        .describe("Database type"),
      connectionString: z.string().optional().describe("Full connection string/URI"),
      host: z.string().optional().describe("Database host"),
      port: z.number().optional().describe("Database port"),
      database: z.string().optional().describe("Database name"),
      username: z.string().optional().describe("Username"),
      password: z.string().optional().describe("Password"),
      credentialName: z
        .string()
        .optional()
        .describe("Name of stored credential to use"),

      // Query/Execute
      sql: z.string().optional().describe("SQL query to execute"),
      params: z.array(z.unknown()).optional().describe("Query parameters (for parameterized queries)"),

      // Schema
      table: z.string().optional().describe("Table/collection name for schema inspection"),

      // MongoDB specific
      collection: z.string().optional().describe("MongoDB collection name"),
      operation: z
        .enum(["find", "findOne", "insertOne", "insertMany", "updateOne", "updateMany", "deleteOne", "deleteMany", "count", "aggregate"])
        .optional()
        .describe("MongoDB operation"),
      filter: z.record(z.string(), z.unknown()).optional().describe("MongoDB filter/query"),
      document: z.record(z.string(), z.unknown()).optional().describe("Document to insert"),
      documents: z.array(z.record(z.string(), z.unknown())).optional().describe("Documents to insert"),
      update: z.record(z.string(), z.unknown()).optional().describe("MongoDB update operations"),
      pipeline: z.array(z.record(z.string(), z.unknown())).optional().describe("MongoDB aggregation pipeline"),
      limit: z.number().optional().describe("Result limit"),

      // Redis specific
      command: z.string().optional().describe("Redis command (GET, SET, HGET, etc.)"),
      args: z.array(z.unknown()).optional().describe("Redis command arguments"),
    }),
    async execute(params, ctx) {
      const connName = params.name || "default"

      // Handle disconnect
      if (params.action === "disconnect") {
        await closeConnection(connName)
        return {
          title: "Disconnected",
          metadata: {},
          output: `Closed connection: ${connName}`,
        }
      }

      // Handle connect
      if (params.action === "connect") {
        if (!params.type) {
          throw new Error("Database type is required for connect action")
        }

        // Request permission
        await ctx.ask({
          permission: "database",
          patterns: [params.type],
          always: [params.type],
          metadata: {},
        })

        // Get credentials if specified
        let config: any = {
          connectionString: params.connectionString,
          host: params.host,
          port: params.port,
          database: params.database,
          user: params.username,
          password: params.password,
        }

        if (params.credentialName) {
          const cred = await Credentials.getTyped(params.credentialName, "database")
          if (cred) {
            config = {
              connectionString: cred.connectionString,
              host: cred.host,
              port: cred.port,
              database: cred.database,
              user: cred.username,
              password: cred.password,
              ssl: cred.ssl,
            }
          }
        }

        try {
          let client: any

          switch (params.type) {
            case "postgres":
              client = await connectPostgres(config)
              break
            case "mysql":
              client = await connectMysql(config)
              break
            case "sqlite":
              client = await connectSqlite(params.database || ":memory:")
              break
            case "mongodb":
              client = await connectMongodb(config)
              break
            case "redis":
              client = await connectRedis(config)
              break
          }

          connections.set(connName, {
            type: params.type,
            client,
            createdAt: Date.now(),
          })

          return {
            title: `Connected to ${params.type}`,
            metadata: {},
            output: `Successfully connected to ${params.type} database as "${connName}"`,
          }
        } catch (error) {
          throw new Error(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`)
        }
      }

      // Get existing connection
      const conn = connections.get(connName)
      if (!conn) {
        throw new Error(`No connection named "${connName}". Use action: "connect" first.`)
      }

      try {
        switch (params.action) {
          case "query":
          case "execute": {
            if (!params.sql) {
              throw new Error("SQL query is required")
            }

            // Request write permission for non-SELECT queries
            const isWrite = !params.sql.trim().toLowerCase().startsWith("select")
            if (isWrite) {
              await ctx.ask({
                permission: "database_write",
                patterns: [params.sql.slice(0, 50)],
                always: [],
                metadata: {},
              })
            }

            const result = await executeQuery(conn, params.sql, params.params as any[])

            // Format output
            let output: string
            if (result.rows.length === 0) {
              output = `Query executed. Rows affected: ${result.rowCount}`
            } else {
              output = JSON.stringify(result.rows, null, 2)
              if (result.rows.length > 50) {
                output = JSON.stringify(result.rows.slice(0, 50), null, 2) + `\n... (${result.rows.length - 50} more rows)`
              }
            }

            return {
              title: `Query returned ${result.rowCount} rows`,
              metadata: {},
              output,
            }
          }

          case "schema": {
            const schema = await getSchema(conn, params.table)
            return {
              title: params.table ? `Schema for ${params.table}` : "Database schema",
              metadata: {},
              output: JSON.stringify(schema, null, 2),
            }
          }

          case "mongodb": {
            if (!params.collection || !params.operation) {
              throw new Error("Collection and operation are required for MongoDB actions")
            }

            // Request write permission for mutations
            const writeMutations = ["insertOne", "insertMany", "updateOne", "updateMany", "deleteOne", "deleteMany"]
            if (writeMutations.includes(params.operation)) {
              await ctx.ask({
                permission: "database_write",
                patterns: [params.operation],
                always: [],
                metadata: {},
              })
            }

            const result = await executeMongodb(conn, params.collection, params.operation, {
              filter: params.filter,
              document: params.document,
              documents: params.documents,
              update: params.update,
              pipeline: params.pipeline,
              limit: params.limit,
            })

            return {
              title: `MongoDB ${params.operation}`,
              metadata: {},
              output: JSON.stringify(result, null, 2),
            }
          }

          case "redis": {
            if (!params.command) {
              throw new Error("Redis command is required")
            }

            // Request write permission for mutations
            const writeCommands = ["set", "del", "hset", "lpush", "rpush", "sadd", "zadd", "expire", "flushdb", "flushall"]
            if (writeCommands.includes(params.command.toLowerCase())) {
              await ctx.ask({
                permission: "database_write",
                patterns: [params.command],
                always: [],
                metadata: {},
              })
            }

            const result = await executeRedis(conn, params.command, params.args || [])

            return {
              title: `Redis ${params.command}`,
              metadata: {},
              output: typeof result === "object" ? JSON.stringify(result, null, 2) : String(result),
            }
          }

          default:
            throw new Error(`Unknown action: ${params.action}`)
        }
      } catch (error) {
        throw new Error(`Database error: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  }
})
