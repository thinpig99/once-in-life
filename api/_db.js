import { neon } from '@neondatabase/serverless'
import crypto from 'node:crypto'

export const sql = neon(process.env.DATABASE_URL)

export const hash = (t) => crypto.createHash('sha256').update(String(t)).digest('hex')
export const newToken = () => crypto.randomBytes(24).toString('hex')
export const newCode = () => crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, 'x').slice(0, 7).toUpperCase()

export async function auth(req) {
  const t = req.headers['x-planner-token']
  if (!t) return null
  const r = await sql`select planner_id from members where token_hash = ${hash(t)}`
  return r[0]?.planner_id || null
}

export async function loadPlanner(id) {
  const [p] = await sql`select id, wedding_date::text as wedding_date, budget, pct, invite_code from planners where id = ${id}`
  if (!p) return null
  const tasks = await sql`select key, status, spent, memo, subs, hidden, name, offset_days, sub_names from tasks where planner_id = ${id}`
  const custom = await sql`select key, phase, name, offset_days, axis, cat, sub_names from custom_tasks where planner_id = ${id} order by created_at`
  const [{ count }] = await sql`select count(*)::int as count from members where planner_id = ${id}`
  return { ...p, members: count, tasks, custom }
}

export function validPct(pct) {
  return Array.isArray(pct) && pct.length === 4 && pct.every((n) => Number.isInteger(n) && n >= 0 && n <= 100) && pct.reduce((a, b) => a + b, 0) === 100
}

export function validDate(d) {
  return d === null || (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
}
