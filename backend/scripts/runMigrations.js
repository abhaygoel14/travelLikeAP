import fs from 'fs/promises'
import path from 'path'
import sql from '../utils/db.js'

async function run() {
  try {
    const file = path.join(process.cwd(), 'migrations', 'init.sql')
    const sqlText = await fs.readFile(file, 'utf8')
    // split statements by semicolon and run non-empty ones
    const statements = sqlText.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)
    for (const stmt of statements) {
      await sql.unsafe(stmt)
    }
    console.log('Migrations applied')
    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

run()
