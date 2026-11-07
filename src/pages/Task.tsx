import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PHASES, TASKS, CATS, STATUS, timingLabel } from '../../shared/catalog.js'
import { useStore } from '../store'
import { addDays, today, fmtDate, leftLabel, stateOf, usedByCat, won } from '../lib'
import { Back, Icon } from '../components'

export default function Task() {
  const { key } = useParams()
  const { planner: p, patchTask } = useStore()
  const def = TASKS.find((t) => t.key === key)
  const s = p && def ? stateOf(p, def.key) : null
  const [spent, setSpent] = useState(String(s?.spent || ''))
  const [memo, setMemo] = useState(s?.memo || '')
  useEffect(() => { setSpent(String(s?.spent || '')); setMemo(s?.memo || '') }, [key])
  if (!p || !def || !s) return <Navigate to="/" replace />

  const all = [...TASKS].sort((a, b) => a.offset - b.offset)
  const idx = all.findIndex((t) => t.key === def.key)
  const prev = all[idx - 1], next = all[idx + 1]
  const due = p.wedding_date ? addDays(p.wedding_date, def.offset) : null
  const left = due ? Math.round((due.getTime() - today().getTime()) / 86400e3) : null
  const ci = CATS.findIndex((c) => c.key === def.cat)
  const catBudget = ci >= 0 ? Math.round((p.budget * p.pct[ci]) / 100) : null
  const catUsed = ci >= 0 ? usedByCat(p)[ci] : 0
  const subs = def.subs.map((_, i) => !!s.subs[i])

  const toggleSub = (i: number) => {
    const n = subs.map((v, k) => (k === i ? !v : v))
    patchTask(def.key, { subs: n, status: s.status === 0 && n.some(Boolean) ? 1 : s.status })
  }
  const saveSpent = () => { const v = Math.min(100000, Number(spent.replace(/[^0-9]/g, '')) || 0); if (v !== s.spent) patchTask(def.key, { spent: v, status: s.status === 0 && v > 0 ? 1 : s.status }) }
  const saveMemo = () => { if (memo !== s.memo) patchTask(def.key, { memo }) }

  return (
    <>
      <div className="page" style={{ gap: 16 }}>
        <Back />
        <div style={{ marginTop: -8 }}>
          <div className="muted small">{def.phase + 1}. {PHASES[def.phase]}</div>
          <h1 className="h1" style={{ marginTop: 4 }}>{def.name}</h1>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.5, margin: '4px 0 0' }}>{def.desc}</p>
        </div>

        <div className="card" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon n="cal" c="var(--main)" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{def.offset < 0 ? `결혼 ${timingLabel(def.offset)}까지` : timingLabel(def.offset)}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{due ? `${fmtDate(due)}까지` : '결혼일을 정하면 날짜로 알려드려요'}</div>
          </div>
          {left !== null && s.status !== 2 && <span className="chip" style={left < 0 ? { background: '#F6DADA', color: 'var(--danger)' } : { background: 'var(--peach-bg)', color: 'var(--peach-ink)' }}>{leftLabel(left)}</span>}
        </div>

        <div>
          <div className="muted small" style={{ marginBottom: 6 }}>진행 상태</div>
          <div role="group" aria-label="진행 상태" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 4, background: 'var(--bg2)', borderRadius: 14, padding: 4 }}>
            {STATUS.map((l, i) => (
              <button key={l} aria-pressed={s.status === i} onClick={() => patchTask(def.key, { status: i })} style={{ height: 40, border: 'none', borderRadius: 10, background: s.status === i ? '#fff' : 'transparent', color: s.status === i ? 'var(--deep)' : 'var(--sub)', fontSize: 14, fontWeight: s.status === i ? 700 : 500 }}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
          <div className="card" style={{ padding: 14 }}>
            <div className="muted" style={{ fontSize: 12 }}>{ci >= 0 ? `${CATS[ci].name.replace(/\(.*\)/, '')} 예산` : '배정 예산'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{catBudget !== null ? `${won(catBudget)}만원` : '항목 없음'}</div>
            {catBudget !== null && <div style={{ fontSize: 11, marginTop: 2, color: catUsed > catBudget ? 'var(--danger)' : 'var(--sub)' }}>{catUsed > catBudget ? `${won(catUsed - catBudget)}만원 초과` : `남은 예산 ${won(catBudget - catUsed)}만원`}</div>}
          </div>
          <div className="card" style={{ padding: 14 }}>
            <label htmlFor="spent" className="muted" style={{ display: 'block', fontSize: 12 }}>사용 금액</label>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 2 }}>
              <input id="spent" inputMode="numeric" value={spent} placeholder="0" onChange={(e) => setSpent(e.target.value.replace(/[^0-9]/g, ''))} onBlur={saveSpent}
                style={{ width: 80, border: 'none', borderBottom: '1.5px solid var(--line2)', background: 'transparent', fontSize: 18, fontWeight: 700, color: 'var(--main)', padding: 0, borderRadius: 0 }} />
              <span style={{ fontSize: 14, fontWeight: 700 }}>만원</span>
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}><span className="h2" style={{ fontSize: 16 }}>세부 할 일</span><span className="muted small">{subs.filter(Boolean).length}/{subs.length}</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {def.subs.map((n, i) => (
              <button key={n} onClick={() => toggleSub(i)} aria-pressed={subs[i]} style={{ minHeight: 48, border: 'none', borderRadius: 12, background: 'var(--bg2)', padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', fontSize: 14 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', background: subs[i] ? 'var(--check)' : '#fff', border: subs[i] ? 'none' : '1.5px solid var(--line2)' }}>{subs[i] && <Icon n="tick" s={11} w={3} />}</span>
                <span style={{ flex: 1, color: subs[i] ? 'var(--faint)' : undefined, textDecoration: subs[i] ? 'line-through' : undefined }}>{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: 'var(--soft)', borderRadius: 18, padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--deep)' }}><Icon n="spark" s={18} />AI 플래너 팁</div>
          <div style={{ fontSize: 14, lineHeight: 1.6, color: '#4A3757', marginTop: 8 }}>{def.tip}</div>
          <Link to="/planner" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 700, color: 'var(--main)' }}>플래너에게 더 물어보기</Link>
        </div>

        <div>
          <div className="h2" style={{ fontSize: 16, marginBottom: 8 }}>일정 연결</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
            {[['이전', prev], ['다음', next]].filter(([, t]) => t).map(([l, t]: any) => {
              const ts = stateOf(p, t.key).status
              return (
                <Link key={l} to={`/task/${t.key}`} replace style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', border: '1px solid var(--line)', borderRadius: 12 }}>
                  <span className="muted" style={{ width: 36 }}>{l}</span><span style={{ flex: 1 }}>{t.name}</span>
                  <span style={{ fontWeight: 600, color: ts === 2 ? '#46566E' : 'var(--mid)' }}>{ts === 2 ? '완료' : timingLabel(t.offset)}</span>
                </Link>
              )
            })}
          </div>
        </div>

        <div>
          <label htmlFor="memo" className="h2" style={{ display: 'block', fontSize: 16, marginBottom: 8 }}>메모</label>
          <textarea id="memo" value={memo} maxLength={2000} onChange={(e) => setMemo(e.target.value)} onBlur={saveMemo} placeholder="상담 받은 업체, 견적, 느낀 점을 적어두세요"
            style={{ width: '100%', minHeight: 96, border: '1px solid var(--line)', borderRadius: 12, padding: 12, fontSize: 15, resize: 'vertical' }} />
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>메모는 둘이 함께 보고, AI 플래너도 참고해요.</div>
        </div>

        {def.cat && <Link to="/vendors" className="btn-line">이 단계 추천 업체 보기<Icon n="right" s={16} w={2} /></Link>}
      </div>
      <div className="bottom-cta">
        <button className="btn" style={s.status === 2 ? { background: 'var(--faint)' } : undefined} onClick={() => patchTask(def.key, { status: s.status === 2 ? 1 : 2 })}>{s.status === 2 ? '완료됨 · 되돌리기' : '이 단계 완료하기'}</button>
      </div>
    </>
  )
}
