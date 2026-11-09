import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PHASES, CATS, AXES, timingLabel } from '../../shared/catalog.js'
import { useStore } from '../store'
import { allItems, daysLeft, daysTo, fmtLong, leftLabel, stateOf, usedByCat, won, type Item } from '../lib'
import { Icon, TabBar } from '../components'
import TaskSheet from '../TaskSheet'

const AX = Object.fromEntries(AXES.map((a) => [a.key, a]))

function Chip({ text, kind }: { text: string; kind: 'done' | 'now' | 'late' }) {
  const st = kind === 'done' ? { background: 'var(--bg2)', color: 'var(--sub)' } : kind === 'late' ? { background: '#F6DADA', color: 'var(--danger)' } : { background: 'var(--peach-bg)', color: 'var(--peach-ink)' }
  return <span className="chip" style={st}>{text}</span>
}

export default function Home() {
  const { planner: p, patchTask } = useStore()
  const [filter, setFilter] = useState('all')
  const [sheet, setSheet] = useState<number | null>(null)
  const [showHidden, setShowHidden] = useState<boolean[]>([false, false, false, false])
  const [open, setOpen] = useState<boolean[]>(() => {
    const items = allItems(p!).filter((t) => !t.hidden)
    const first = PHASES.findIndex((_, i) => items.some((t) => t.phase === i && stateOf(p!, t.key).status !== 2))
    return PHASES.map((_, i) => i === (first < 0 ? 0 : first))
  })
  if (!p) return null

  const all = allItems(p)
  const vis = all.filter((t) => !t.hidden)
  const st = (t: Item) => stateOf(p, t.key).status
  const done = vis.filter((t) => st(t) === 2).length
  const pctDone = vis.length ? Math.round((done / vis.length) * 100) : 0
  const used = usedByCat(p)
  const usedSum = used.reduce((a, b) => a + b, 0)
  const anyClosed = open.some((o) => !o)
  const dday = p.wedding_date ? daysTo(p.wedding_date) : null

  // 상태 칩: 완료, 진행 중(남은 기간), 기한 지남. 그 외 예정은 칩 없음
  const chipOf = (t: Item): { text: string; kind: 'done' | 'now' | 'late' } | null => {
    const s = st(t)
    if (s === 2) return { text: '완료', kind: 'done' }
    const d = daysLeft(p, t.offset)
    if (d !== null && d < 0) return { text: leftLabel(d), kind: 'late' }
    if (s === 1) return { text: d !== null ? leftLabel(d) : timingLabel(t.offset), kind: 'now' }
    return null
  }

  // 이번 달 할 일: 이번 달 말까지 기한인 미완료 일 (날짜 미정이면 순서상 다음 3개)
  const now = new Date()
  const monthEnd = Math.round((new Date(now.getFullYear(), now.getMonth() + 1, 0).getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86400e3)
  const pending = vis.filter((t) => st(t) !== 2)
  const thisMonth = p.wedding_date ? pending.filter((t) => (daysLeft(p, t.offset) ?? 0) <= monthEnd).slice(0, 4) : pending.slice(0, 3)

  const row = (t: Item) => {
    const s = st(t), c = chipOf(t), a = AX[t.axis]
    return (
      <Link key={t.key} to={`/task/${t.key}`} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 48, background: '#fff', borderRadius: 12, padding: '6px 10px 6px 12px', marginBottom: 6, border: `1px solid ${c?.kind === 'late' ? '#F0B9B0' : s === 1 ? '#F2C4A8' : '#fff'}` }}>
        <span aria-label={a?.name} style={{ width: 9, height: 9, borderRadius: '50%', background: a?.color, opacity: s === 2 ? 0.35 : 1, flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: s === 1 ? 700 : 500, color: s === 2 ? 'var(--faint)' : undefined }}>{t.name}</span>
        {c && <Chip {...c} />}
        <Icon n="right" s={16} w={2} c="#BBAFC4" />
      </Link>
    )
  }

  return (
    <>
      <div className="page">
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 44 }}><span style={{ fontSize: 18, fontWeight: 700, color: 'var(--main)' }}>이생에단한번</span></div>

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

        {thisMonth.length > 0 && (
          <div style={{ background: '#FBF1EC', borderRadius: 20, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 className="h2" style={{ fontSize: 16, color: 'var(--peach-ink)' }}>{p.wedding_date ? '이번 달 할 일' : '다음 할 일'}</h2>
              <span style={{ fontSize: 12, color: '#B98B78' }}>{p.wedding_date ? `${now.getMonth() + 1}월 · ${thisMonth.length}개` : '날짜를 정하면 기한을 알려드려요'}</span>
            </div>
            <div style={{ marginTop: 10 }}>{thisMonth.map(row)}</div>
          </div>
        )}

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
        <div role="group" aria-label="축으로 걸러 보기" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 4, background: 'var(--bg2)', borderRadius: 14, padding: 4, marginTop: -4 }}>
          {[{ key: 'all', name: '전체', color: '' }, ...AXES].map((a) => {
            const on = filter === a.key
            return (
              <button key={a.key} aria-pressed={on} onClick={() => setFilter(a.key)} style={{ height: 38, border: 'none', borderRadius: 10, padding: 0, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, whiteSpace: 'nowrap', background: on ? '#fff' : 'transparent', color: on ? 'var(--ink)' : 'var(--sub)', fontWeight: on ? 700 : 500 }}>
                {a.color && <span style={{ width: 7, height: 7, borderRadius: '50%', background: a.color, flexShrink: 0 }} />}{a.name}
              </button>
            )
          })}
        </div>

        <div>
          {PHASES.map((name, i) => {
            const inPhase = all.filter((t) => t.phase === i && (filter === 'all' || t.axis === filter))
            const ts = inPhase.filter((t) => !t.hidden)
            const hidden = inPhase.filter((t) => t.hidden)
            const sts = ts.map(st)
            const d = sts.filter((s) => s === 2).length, ing = sts.filter((s) => s === 1).length
            const complete = ts.length > 0 && d === ts.length
            const sub = ts.length === 0 ? '이 축의 할 일이 없어요' : complete ? '모두 완료' : d + ing > 0 ? `완료 ${d} · 진행 중 ${ing} · 예정 ${ts.length - d - ing}` : `${ts.length}개 할 일 · ${timingLabel(ts[0].offset)}부터 시작`
            let last = ''
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
                    <div style={{ padding: '4px 8px 10px 0' }}>
                      {ts.map((t) => {
                        const label = timingLabel(t.offset)
                        const head = label !== last ? <div key={'h' + t.key} style={{ fontSize: 12, fontWeight: 700, color: 'var(--sub)', margin: `${last ? 10 : 0}px 2px 6px` }}>{label}</div> : null
                        last = label
                        return [head, row(t)]
                      })}
                      <button onClick={() => setSheet(i)} style={{ width: '100%', minHeight: 44, border: '1.5px dashed var(--line2)', borderRadius: 12, background: 'transparent', color: 'var(--main)', fontSize: 14, fontWeight: 700, marginTop: 2 }}>+ 할 일 추가</button>
                      {hidden.length > 0 && (
                        <>
                          <button onClick={() => setShowHidden(showHidden.map((v, k) => (k === i ? !v : v)))} aria-expanded={showHidden[i]} style={{ width: '100%', height: 36, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 12, marginTop: 4 }}>{showHidden[i] ? '숨긴 항목 접기' : `숨긴 항목 ${hidden.length}개 보기`}</button>
                          {showHidden[i] && hidden.map((t) => (
                            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, borderRadius: 12, padding: '0 6px 0 12px', marginBottom: 6, border: '1px dashed var(--line2)' }}>
                              <span style={{ flex: 1, fontSize: 14, color: 'var(--faint)' }}>{t.name}</span>
                              <button onClick={() => patchTask(t.key, { hidden: false })} style={{ height: 36, padding: '0 10px', border: 'none', background: 'transparent', color: 'var(--main)', fontSize: 13, fontWeight: 700 }}>되살리기</button>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {sheet !== null && <TaskSheet phase={sheet} onClose={() => setSheet(null)} />}
      <TabBar on="home" />
    </>
  )
}
