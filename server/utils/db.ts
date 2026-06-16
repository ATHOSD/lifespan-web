import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

function getPool(): pg.Pool | null {
  if (!pool && process.env.DATABASE_URL) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  }
  return pool
}

export async function initDb() {
  const p = getPool()
  if (!p) return
  await p.query(`
    CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      ip TEXT,
      lat DOUBLE PRECISION,
      lon DOUBLE PRECISION,
      country TEXT,
      city TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)
}

export async function logVisit(ip: string, lat: number, lon: number, country: string, city: string) {
  const p = getPool()
  if (!p) return
  await p.query(
    'INSERT INTO visits (ip, lat, lon, country, city) VALUES ($1, $2, $3, $4, $5)',
    [ip, lat, lon, country, city],
  )
}

export async function getVisits() {
  const p = getPool()
  if (!p) return []
  const { rows } = await p.query(
    'SELECT lat, lon, country, city, created_at FROM visits ORDER BY created_at DESC',
  )
  return rows
}
