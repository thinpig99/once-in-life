import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATS } from '../../shared/catalog.js'
import { useStore } from '../store'
import { adjustPct, stateOf, usedByCat, visibleItems, won } from '../lib'
import { Back, Dial, PctEditor } from '../components'

export default function Budget() {
  const { planner: p, patchPlanner } = useStore()
  const [budget, setBudget] = useState(p?.budget || 5000)
  const timer = useRef<any>(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  if (!p) return null
  const used = usedByCat(p)
  const usedSum = used.reduce((a, b) => a + b, 0)

  const onBudget = (v: number) => {
    setBudget(v)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => patchPlanner({ budget: v }), 500)
  }

  return (
    <div className="page" style={{ paddingBottom: 40 }}>
      <Back label="예산 관리" to="/" />
      <div style={{ background: 'var(--soft)', borderRadius: 20, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <span style={{ color: 'var(--mid)' }}>사용 {won(usedSum)}만원</span>
          <span style={{ fontWeight: 700, color: usedSum > budget ? 'var(--danger)' : 'var(--deep)' }}>{usedSum > budget ? `${won(usedSum - budget)}만원 초과` : `남음 ${won(budget - usedSum)}만원`}</span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: '#fff', overflow: 'hidden', marginTop: 8 }}><div style={{ width: `${Math.min(100, (usedSum / budget) * 100)}%`, height: '100%', background: 'var(--main)' }} /></div>
      </div>
      <div className="muted small">총 예산</div>
      <Dial value={budget} onChange={onBudget} />
      <h2 className="h2" style={{ marginTop: 8 }}>항목별 예산</h2>
      <PctEditor budget={budget} pct={p.pct} used={used} onChange={(i, dl) => patchPlanner({ pct: adjustPct(p.pct, i, dl) })} />

      <h2 className="h2" style={{ marginTop: 8 }}>사용 내역</h2>
      {CATS.map((c, i) => {
        const b = Math.round((budget * p.pct[i]) / 100)
        const items = visibleItems(p).filter((t) => t.cat === c.key && stateOf(p, t.key).spent > 0)
        const r = b ? used[i] / b : 0
        return (
          <div key={c.key} style={{ border: '1px solid var(--line)', borderRadius: 16, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700 }}>{c.name}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r > 1 ? 'var(--danger)' : 'var(--deep)' }}>{r > 1 ? `${won(used[i] - b)}만원 초과` : `${Math.round(r * 100)}% 사용`}</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>사용 {won(used[i])} / 예산 {won(b)}만원</div>
            <div style={{ height: 6, borderRadius: 3, background: '#F1ECF4', overflow: 'hidden', marginTop: 6 }}><div style={{ width: `${Math.min(100, r * 100)}%`, height: '100%', background: r > 1 ? 'var(--danger)' : c.color }} /></div>
            {items.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {items.map((t) => (
                  <Link key={t.key} to={`/task/${t.key}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 40, padding: '0 10px', borderRadius: 10, background: 'var(--bg2)', fontSize: 13 }}>
                    <span>{t.name}</span><span style={{ fontWeight: 600 }}>{won(stateOf(p, t.key).spent)}만원</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
      <p className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>사용 금액은 각 체크리스트 세부 화면에서 입력하면 여기에 자동으로 모여요.</p>
    </div>
  )
}
