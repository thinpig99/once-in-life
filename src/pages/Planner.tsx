import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { api, daysTo, stateOf, visibleItems, won } from '../lib'
import { Icon, TabBar } from '../components'

type Msg = { role: 'user' | 'model'; text: string }

export default function Planner() {
  const { planner: p } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const end = useRef<HTMLDivElement>(null)

  useEffect(() => { api('chat').then((d) => setMsgs(d.messages)).catch(() => {}) }, [])
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, busy])
  if (!p) return null

  const vis = visibleItems(p)
  const done = vis.filter((t) => stateOf(p, t.key).status === 2).length
  const used = p.tasks.reduce((a, t) => a + (t.spent || 0), 0)
  const send = async (text: string) => {
    text = text.trim()
    if (!text || busy) return
    setErr(''); setDraft(''); setBusy(true)
    setMsgs((m) => [...m, { role: 'user', text }])
    try {
      const d = await api('chat', 'POST', { text })
      setMsgs((m) => [...m, { role: 'model', text: d.reply }])
    } catch (e: any) {
      setErr(e.message); setMsgs((m) => m.slice(0, -1)); setDraft(text)
    } finally { setBusy(false) }
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', paddingBottom: 'calc(170px + env(safe-area-inset-bottom))' }}>
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 2, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #F1ECF4' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--soft)', color: 'var(--main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="spark" s={18} /></div>
          <div><div style={{ fontSize: 16, fontWeight: 700 }}>AI 플래너</div><div className="muted" style={{ fontSize: 12 }}>우리 체크리스트·예산·메모를 함께 보고 있어요</div></div>
        </div>
        <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ alignSelf: 'center', display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[p.wedding_date ? `D-${daysTo(p.wedding_date)}` : '날짜 미정', `완료 ${done}/${vis.length}`, `예산 ${won(used)} / ${won(p.budget)}만원`].map((x) => (
              <span key={x} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'var(--bg2)', color: 'var(--sub)' }}>{x}</span>
            ))}
          </div>
          {msgs.length === 0 && !busy && (
            <div style={{ alignSelf: 'flex-start', maxWidth: '86%', background: 'var(--bg2)', borderRadius: '4px 18px 18px 18px', padding: '12px 14px', fontSize: 15, lineHeight: 1.6 }}>
              안녕하세요, 이생에단한번 플래너예요. 지금 진행 상황을 보고 다음에 할 일, 예산 조정, 업체 고르는 법까지 같이 고민해 드릴게요.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} style={m.role === 'user'
              ? { alignSelf: 'flex-end', maxWidth: '80%', background: 'var(--main)', color: '#fff', borderRadius: '18px 4px 18px 18px', padding: '12px 14px', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }
              : { alignSelf: 'flex-start', maxWidth: '86%', background: 'var(--bg2)', borderRadius: '4px 18px 18px 18px', padding: '12px 14px', fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.text.replace(/\*\*/g, '')}</div>
          ))}
          {busy && <div className="muted" style={{ alignSelf: 'flex-start', fontSize: 14, padding: '8px 4px' }}>플래너가 생각하는 중…</div>}
          <div ref={end} />
        </div>
      </div>
      <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 'calc(92px + env(safe-area-inset-bottom))', width: '100%', maxWidth: 480, background: '#fff', padding: '8px 16px', zIndex: 4 }}>
        {err && <div role="alert" style={{ fontSize: 13, color: 'var(--danger)', marginBottom: 6 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 8 }}>
          {['이번 달에 뭘 해야 해?', '예산 다시 나눠줘', '지금 놓친 거 없어?'].map((c) => (
            <button key={c} onClick={() => send(c)} disabled={busy} style={{ flexShrink: 0, height: 36, padding: '0 12px', border: '1px solid var(--line2)', borderRadius: 999, background: '#fff', color: 'var(--deep)', fontSize: 13 }}>{c}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(draft) }} style={{ display: 'flex', gap: 8 }}>
          <label htmlFor="ask" className="sr">플래너에게 질문</label>
          <input id="ask" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder="무엇이든 물어보세요" style={{ flex: 1, height: 48, border: '1px solid var(--line)', borderRadius: 24, padding: '0 18px', fontSize: 16 }} />
          <button type="submit" aria-label="보내기" disabled={busy || !draft.trim()} style={{ width: 48, height: 48, border: 'none', borderRadius: '50%', background: 'var(--main)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy || !draft.trim() ? 0.5 : 1 }}><Icon n="send" s={20} w={2} /></button>
        </form>
      </div>
      <TabBar on="planner" />
    </>
  )
}
