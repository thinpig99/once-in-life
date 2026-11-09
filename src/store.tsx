import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, getToken, setToken, type Planner, type TaskState, type Custom } from './lib'

type Store = {
  planner: Planner | null
  loading: boolean
  start: (token: string, p: Planner) => void
  leave: () => void
  patchPlanner: (b: Partial<Pick<Planner, 'wedding_date' | 'budget' | 'pct'>>) => Promise<void>
  patchTask: (key: string, b: Partial<Omit<TaskState, 'key'>>) => Promise<void>
  addCustom: (b: Omit<Custom, 'key'>) => Promise<string | null>
  editCustom: (key: string, b: Partial<Omit<Custom, 'key'>>) => Promise<void>
  removeCustom: (key: string) => Promise<void>
  toast: (m: string) => void
}

const Ctx = createContext<Store>(null as any)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [planner, setPlanner] = useState<Planner | null>(null)
  const [loading, setLoading] = useState(!!getToken())
  const [msg, setMsg] = useState('')

  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2400) }, [])

  useEffect(() => {
    if (!getToken()) return
    api('planner').then((d) => setPlanner(d.planner)).catch((e) => { if (e.status === 401) setToken(null); else toast(e.message) }).finally(() => setLoading(false))
  }, [toast])

  const start = (token: string, p: Planner) => { setToken(token); setPlanner(p) }
  const leave = () => { setToken(null); setPlanner(null) }

  const patchPlanner: Store['patchPlanner'] = async (b) => {
    setPlanner((p) => (p ? { ...p, ...b } : p))
    try { const d = await api('planner', 'PATCH', b); setPlanner(d.planner) } catch (e: any) { toast(e.message) }
  }

  const patchTask: Store['patchTask'] = async (key, b) => {
    setPlanner((p) => {
      if (!p) return p
      const cur = p.tasks.find((t) => t.key === key) || { key, status: 0, spent: 0, memo: '', subs: [] }
      return { ...p, tasks: [...p.tasks.filter((t) => t.key !== key), { ...cur, ...b }] }
    })
    try { await api('task', 'PATCH', { key, ...b }) } catch (e: any) { toast(e.message) }
  }

  const addCustom: Store['addCustom'] = async (b) => {
    try { const d = await api('custom', 'POST', b); setPlanner((p) => (p ? { ...p, custom: [...(p.custom || []), d.custom] } : p)); return d.custom.key } catch (e: any) { toast(e.message); return null }
  }
  const editCustom: Store['editCustom'] = async (key, b) => {
    setPlanner((p) => (p ? { ...p, custom: p.custom.map((c) => (c.key === key ? { ...c, ...b } : c)) } : p))
    try { await api('custom', 'PATCH', { key, ...b }) } catch (e: any) { toast(e.message) }
  }
  const removeCustom: Store['removeCustom'] = async (key) => {
    setPlanner((p) => (p ? { ...p, custom: p.custom.filter((c) => c.key !== key), tasks: p.tasks.filter((t) => t.key !== key) } : p))
    try { await api('custom', 'DELETE', { key }) } catch (e: any) { toast(e.message) }
  }

  return (
    <Ctx.Provider value={{ planner, loading, start, leave, patchPlanner, patchTask, addCustom, editCustom, removeCustom, toast }}>
      {children}
      {msg && <div className="toast" role="status">{msg}</div>}
    </Ctx.Provider>
  )
}
