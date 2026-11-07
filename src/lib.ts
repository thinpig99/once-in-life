import { TASKS, CATS } from '../shared/catalog.js'

export type TaskState = { key: string; status: number; spent: number; memo: string; subs: boolean[] }
export type Planner = { id: string; wedding_date: string | null; budget: number; pct: number[]; invite_code: string; members: number; tasks: TaskState[] }

const TOKEN = 'oil_token'
export const getToken = () => { try { return localStorage.getItem(TOKEN) } catch { return null } }
export const setToken = (t: string | null) => { try { t ? localStorage.setItem(TOKEN, t) : localStorage.removeItem(TOKEN) } catch {} }

export async function api(path: string, method = 'GET', body?: unknown) {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: { 'content-type': 'application/json', 'x-planner-token': getToken() || '' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(data.error || '잠시 후 다시 시도해 주세요.'), { status: r.status })
  return data
}

export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }
export const daysTo = (iso: string) => Math.round((new Date(iso + 'T00:00:00').getTime() - today().getTime()) / 86400e3)
export const addDays = (iso: string, n: number) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return d }
export const fmtDate = (d: Date) => `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
export const fmtLong = (iso: string) => { const d = new Date(iso + 'T00:00:00'); return `${fmtDate(d)} ${'일월화수목금토'[d.getDay()]}요일` }
export const won = (n: number) => Math.round(n).toLocaleString('ko-KR')

export function leftLabel(days: number) {
  if (days < 0) return `${-days}일 지남`
  if (days === 0) return '오늘까지'
  if (days < 14) return `${days}일 남음`
  if (days < 60) return `${Math.round(days / 7)}주 남음`
  return `${Math.round(days / 30)}개월 남음`
}

export const stateOf = (p: Planner, key: string): TaskState =>
  p.tasks.find((t) => t.key === key) || { key, status: 0, spent: 0, memo: '', subs: [] }

export const sortedTasks = (phase: number) => TASKS.filter((t) => t.phase === phase).sort((a, b) => a.offset - b.offset)

export function usedByCat(p: Planner) {
  return CATS.map((c) => TASKS.filter((t) => t.cat === c.key).reduce((a, t) => a + (stateOf(p, t.key).spent || 0), 0))
}

export function adjustPct(pct: number[], i: number, dl: number) {
  const p = pct.slice()
  if (p[i] + dl < 0 || p[i] + dl > 90) return pct
  let j = -1
  for (let k = 0; k < p.length; k++) {
    if (k === i) continue
    if (dl > 0 ? p[k] >= dl && (j < 0 || p[k] > p[j]) : j < 0 || p[k] < p[j]) j = k
  }
  if (j < 0) return pct
  p[i] += dl; p[j] -= dl
  return p
}
