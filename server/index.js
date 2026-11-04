import 'dotenv/config'
import cors from 'cors'
import { createHmac, timingSafeEqual } from 'node:crypto'
import express from 'express'
import pg from 'pg'

const { Pool } = pg
const app = express()
const port = process.env.PORT || 3000

if (!process.env.DATABASE_URL) {
  throw new Error('Falta DATABASE_URL. Copia .env.example como .env y completa tu contraseña de PostgreSQL.')
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const sessionCookieName = 'takumi_session'
const sessionSecret = process.env.SESSION_SECRET || 'takumi-demo-local-session-secret-change-before-production'

app.use(cors())
app.use(express.json())

function getCookie(request, name) {
  const cookies = request.headers.cookie || ''
  const value = cookies.split(';').map((cookie) => cookie.trim()).find((cookie) => cookie.startsWith(`${name}=`))
  return value ? decodeURIComponent(value.slice(name.length + 1)) : null
}

function sign(value) {
  return createHmac('sha256', sessionSecret).update(value).digest('base64url')
}

function getSession(request) {
  const token = getCookie(request, sessionCookieName)
  if (!token) return null
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null
  const expectedSignature = sign(payload)
  if (signature.length !== expectedSignature.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return session.user && session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

function requireAuth(request, response, next) {
  const session = getSession(request)
  if (!session) return response.status(401).json({ message: 'Tu sesión no es válida o ha expirado.' })
  request.user = session.user
  next()
}

function createSession(response, user) {
  const maxAge = 1000 * 60 * 60 * 8
  const payload = Buffer.from(JSON.stringify({ user, expiresAt: Date.now() + maxAge })).toString('base64url')
  const token = `${payload}.${sign(payload)}`
  response.cookie(sessionCookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    path: '/',
  })
}

app.get('/api/health', async (_request, response) => {
  const result = await pool.query('SELECT NOW() AS database_time')
  response.json({ connected: true, databaseTime: result.rows[0].database_time })
})

app.post('/api/auth/login', async (request, response) => {
  const { username, password } = request.body
  if (!username || !password) return response.status(400).json({ message: 'Completa usuario y contraseña.' })

  if (username !== 'admin' || password !== 'admin123') {
    return response.status(401).json({ message: 'Usuario o contraseña incorrectos.' })
  }

  const result = await pool.query(
    "SELECT id, full_name, email, role FROM users WHERE role = 'ADMIN' AND is_active = TRUE LIMIT 1",
  )

  const user = result.rows[0] || { full_name: 'Administrador', role: 'ADMIN' }
  createSession(response, user)
  return response.json({ user })
})

app.get('/api/auth/session', (request, response) => {
  const session = getSession(request)
  if (!session) return response.status(401).json({ message: 'Inicia sesión para continuar.' })
  return response.json({ user: session.user })
})

app.post('/api/auth/logout', (request, response) => {
  response.clearCookie(sessionCookieName, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
  return response.status(204).end()
})

app.get('/api/customers', requireAuth, async (_request, response) => {
  const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC')
  response.json(result.rows)
})

app.get('/api/orders', requireAuth, async (_request, response) => {
  const result = await pool.query(`
    SELECT ro.*, c.full_name AS customer_name, m.brand, m.model, m.plate
    FROM repair_orders ro
    JOIN customers c ON c.id = ro.customer_id
    JOIN motorcycles m ON m.id = ro.motorcycle_id
    ORDER BY ro.created_at DESC
  `)
  response.json(result.rows)
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ message: 'No fue posible consultar PostgreSQL.', detail: error.message })
})

app.listen(port, () => console.log(`API Takumi disponible en http://localhost:${port}`))
