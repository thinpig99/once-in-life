import { CATS, mergeTasks } from '../shared/catalog.js'

export type TaskState = { key: string; status: number; spent: number; memo: string; subs: boolean[]; hidden?: boolean; name?: string | null; offset_days?: number | null; sub_names?: string[] | null; extra?: any }
export type Custom = { key: string; phase: number; name: string; offset_days: number; axis: string; cat: string | null; sub_names: string[] }
export type Planner = { id: string; wedding_date: string | null; budget: number; pct: number[]; invite_code: string; members: number; tasks: TaskState[]; custom: Custom[] }
export type Item = { key: string; phase: number; axis: string; name: string; offset: number; cat: string | null; desc: string; subs: string[]; tip: string; why: string; link?: { label: string; url: string } | null; custom: boolean; hidden: boolean }

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

export const allItems = (p: Planner): Item[] => mergeTasks(p.tasks, p.custom || []) as Item[]
export const visibleItems = (p: Planner) => allItems(p).filter((t) => !t.hidden)

// 결혼일이 있으면 마감까지 남은 날 수, 없으면 null
export const daysLeft = (p: Planner, offset: number) => (p.wedding_date ? Math.round((addDays(p.wedding_date, offset).getTime() - today().getTime()) / 86400e3) : null)

export function usedByCat(p: Planner) {
  const items = visibleItems(p)
  return CATS.map((c) => items.filter((t) => t.cat === c.key).reduce((a, t) => a + (stateOf(p, t.key).spent || 0), 0))
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

// 시기 선택지 (일 단위)
export const OFFSET_CHOICES: [number, string][] = [
  ...[15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2].map((m) => [-m * 30, `${m}개월 전`] as [number, string]),
  [-30, '1개월 전'], [-21, '3주 전'], [-14, '2주 전'], [-7, '1주 전'], [-3, '3일 전'], [-1, '하루 전'],
  [0, '결혼 당일'], [3, '결혼 후 3일'], [7, '결혼 후 1주'], [14, '결혼 후 2주'], [30, '결혼 후 1개월'], [60, '결혼 후 2개월'],
]
