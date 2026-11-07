import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PHASES, TASKS, CATS, timingLabel } from '../../shared/catalog.js'
import { useStore } from '../store'
import { daysTo, fmtLong, sortedTasks, stateOf, usedByCat, won } from '../lib'
import { Icon, TabBar } from '../components'

export default function Home() {
  const { planner: p } = useStore()
  const [open, setOpen] = useState<boolean[]>(() => {
    const first = PHASES.findIndex((_, i) => sortedTasks(i).some((t) => stateOf(p!, t.key).status !== 2))
    return PHASES.map((_, i) => i === (first < 0 ? 0 : first))
  })
  if (!p) return null
  const done = TASKS.filter((t) => stateOf(p, t.key).status === 2).length
  const pctDone = Math.round((done / TASKS.length) * 100)
  const used = usedByCat(p)
  const usedSum = used.reduce((a, b) => a + b, 0)
  const anyClosed = open.some((o) => !o)
  const dday = p.wedding_date ? daysTo(p.wedding_date) : null

  return (
    <>
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--main)' }}>이생에단한번</span>
        </div>

        <div style={{ background: 'var(--deep)', borderRadius: 22, padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <div>
            <div style={{ fontSize: 13, color: '#E3D6EB' }}>설레는 그날까지</div>
            <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, lineHeight: 1.2 }}>{dday === null ? '날짜 미정' : dday > 0 ? `D-${dday}` : dday === 0 ? 'D-DAY' : `D+${-dday}`}</div>
            <div style={{ fontSize: 13, color: '#E3D6EB' }}>{p.wedding_date ? fmtLong(p.wedding_date) : <Link to="/me" style={{ textDecoration: 'underline' }}>날짜 정하기</Link>}</div>
          </div>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#B35E38' }}>{pctDone}%</span>
            <span style={{ fontSize: 11, color: 'var(--mid)' }}>진행률</span>
          </div>
        </div>

        <Link to="/budget" className="card" style={{ display: 'block' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small">예산 사용</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--main)', display: 'flex', alignItems: 'center', gap: 2 }}>예산 관리<Icon n="right" s={14} w={2} /></span>
          </div>
          <div style={{ margin: '4px 0 10px' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--deep)' }}>{won(usedSum)}만</span>
            <span className="muted" style={{ fontSize: 14 }}> / {won(p.budget)}만원 · {Math.round((usedSum / p.budget) * 100)}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'var(--line)', overflow: 'hidden' }}><div style={{ width: `${Math.min(100, (usedSum / p.budget) * 100)}%`, height: '100%', background: usedSum > p.budget ? 'var(--danger)' : 'var(--main)' }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 12px', marginTop: 12, fontSize: 12 }}>
            {CATS.map((c, i) => {
              const b = Math.round((p.budget * p.pct[i]) / 100)
              return (
                <div key={c.key} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />{c.name.replace(/\(.*\)/, '')}</span>
                  <span style={{ fontWeight: 600, color: used[i] > b ? 'var(--danger)' : undefined }}>{won(used[i])} / {won(b)}</span>
                </div>
              )
            })}
          </div>
        </Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <h2 className="h2">웨딩 체크리스트</h2>
          <button onClick={() => setOpen(PHASES.map(() => anyClosed))} style={{ height: 36, padding: '0 12px', border: 'none', borderRadius: 999, background: 'var(--bg2)', color: 'var(--mid)', fontSize: 13, fontWeight: 600 }}>{anyClosed ? '모두 펼치기' : '모두 접기'}</button>
        </div>

        <div>
          {PHASES.map((name, i) => {
            const ts = sortedTasks(i)
            const st = ts.map((t) => stateOf(p, t.key).status)
            const d = st.filter((s) => s === 2).length, ing = st.filter((s) => s === 1).length
            const complete = d === ts.length
            const sub = complete ? '모두 완료' : d + ing > 0 ? `완료 ${d} · 진행 중 ${ing} · 예정 ${ts.length - d - ing}` : `${ts.length}개 할 일 · ${timingLabel(ts[0].offset)}부터 시작`
            return (
              <div key={i} style={{ display: 'flex', gap: 12, position: 'relative', paddingBottom: 12 }}>
                {i < 3 && <div style={{ position: 'absolute', left: 15, top: 44, bottom: 0, borderLeft: '2px dotted var(--line2)' }} />}
                <div style={{ width: 32, height: 32, marginTop: 10, borderRadius: '50%', background: complete ? 'var(--check)' : 'var(--soft)', color: complete ? '#fff' : 'var(--main)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {complete ? <Icon n="tick" s={14} w={2.6} /> : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0, background: 'var(--bg2)', borderRadius: 16, padding: '4px 6px 4px 14px' }}>
                  <button onClick={() => setOpen(open.map((o, k) => (k === i ? !o : o)))} aria-expanded={open[i]} style={{ width: '100%', minHeight: 48, border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                    <span style={{ flex: 1 }}><span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{name}</span><span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>{sub}</span></span>
                    <span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--main)', transform: open[i] ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><Icon n="down" s={18} w={2} /></span>
                  </button>
                  {open[i] && (
                    <div style={{ padding: '4px 8px 10px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {ts.map((t) => {
                        const s = stateOf(p, t.key).status
                        const doneT = s === 2, ingT = s === 1
                        return (
                          <Link key={t.key} to={`/task/${t.key}`} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 52, background: '#fff', borderRadius: 12, padding: '8px 10px 8px 12px', border: `1px solid ${ingT ? '#F2C4A8' : '#fff'}` }}>
                            <span style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, background: doneT ? 'var(--line2)' : ingT ? 'var(--peach)' : 'var(--soft)', flexShrink: 0 }} />
                            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: ingT ? 700 : 500, color: doneT ? 'var(--faint)' : undefined }}>{t.name}</span>
                            <span className="chip" style={doneT ? { background: 'var(--bg2)', color: 'var(--sub)' } : ingT ? { background: 'var(--peach-bg)', color: 'var(--peach-ink)', border: '1px solid #F2C4A8' } : { background: '#fff', color: 'var(--mid)', border: '1px solid var(--line2)' }}>
                              {doneT ? '완료' : timingLabel(t.offset)}
                            </span>
                            <Icon n="right" s={16} w={2} c="#BBAFC4" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <TabBar on="home" />
    </>
  )
}
