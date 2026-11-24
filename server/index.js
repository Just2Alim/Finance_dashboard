import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createBusinessAnalysis } from './ai.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
app.disable('x-powered-by')
app.use(helmet({ contentSecurityPolicy: { directives: {
  defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:'], fontSrc: ["'self'"], connectSrc: ["'self'"],
  objectSrc: ["'none'"], baseUri: ["'self'"], frameAncestors: ["'none'"],
} } }))
app.use(express.json({ limit: '16kb', strict: true }))
app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) }))
app.post('/api/ai/analyze', rateLimit({ windowMs: 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false }), async (req, res) => {
  const result = await createBusinessAnalysis(req.body)
  res.status(result.status).json(result.body)
})
app.use('/api', (_req, res) => res.status(404).json({ error: 'API маршрут не найден.' }))

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(root, 'dist'), { maxAge: '1h', index: false }))
  app.get(/.*/, (_req, res) => res.sendFile(path.join(root, 'dist', 'index.html')))
}

app.listen(port, () => console.log(`FIELDNOTE server listening on ${port}`))
