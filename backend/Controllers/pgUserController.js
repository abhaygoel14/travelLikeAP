import sql from '../utils/db.js'
import bcrypt from 'bcryptjs'

export async function createUser({ name, email, password, role = 'user' }) {
  const hashed = await bcrypt.hash(password, 10)
  const result = await sql`
    INSERT INTO users (name, email, password, role)
    VALUES (${name}, ${email}, ${hashed}, ${role})
    RETURNING *
  `
  return result[0]
}

export async function getUserByEmail(email) {
  const result = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`
  return result[0]
}

export async function getUserById(id) {
  const result = await sql`SELECT id, name, email, role, created_at FROM users WHERE id = ${id} LIMIT 1`
  return result[0]
}

export async function updateUser(req, res) {
  try {
    const id = Number(req.params.id)
    const fields = req.body
    const setClauses = []
    const values = []
    let idx = 1
    for (const key in fields) {
      setClauses.push(sql.literal(`${sql`${key}`} = $${idx}`))
      values.push(fields[key])
      idx++
    }
    // fallback simple update for common fields
    const result = await sql`
      UPDATE users SET
        name = ${fields.name},
        email = ${fields.email},
        role = ${fields.role}
      WHERE id = ${id}
      RETURNING id, name, email, role, created_at
    `
    res.status(200).json({ success: true, data: result[0] })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function deleteUser(req, res) {
  try {
    const id = Number(req.params.id)
    await sql`DELETE FROM users WHERE id = ${id}`
    res.status(200).json({ success: true, message: 'Successfully deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

export async function getSingleUser(req, res) {
  try {
    const id = Number(req.params.id)
    const user = await sql`SELECT id, name, email, role, created_at FROM users WHERE id = ${id} LIMIT 1`
    res.status(200).json({ success: true, data: user[0] })
  } catch (err) {
    res.status(404).json({ success: false, message: err.message })
  }
}

export async function getAllUser(req, res) {
  try {
    const users = await sql`SELECT id, name, email, role, created_at FROM users ORDER BY id DESC`
    res.status(200).json({ success: true, data: users })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// Example Express handler for registration
export async function registerHandler(req, res) {
  try {
    const { name, email, password } = req.body
    const existing = await getUserByEmail(email)
    if (existing) return res.status(409).json({ message: 'Email already in use' })
    const user = await createUser({ name, email, password })
    res.status(201).json({ user })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// Example Express handler for login
export async function loginHandler(req, res) {
  try {
    const { email, password } = req.body
    const user = await getUserByEmail(email)
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })
    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })
    // create a session / JWT as needed here
    res.json({ message: 'Logged in', user: { id: user.id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
