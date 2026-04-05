import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/travel'

const sql = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 10,
})

export default sql
