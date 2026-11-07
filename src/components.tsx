import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CATS } from '../shared/catalog.js'
import { won } from './lib'

const P: Record<string, string> = {
  check: 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9',
  spark: 'M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 16l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  store: 'M4 21V9l8-6 8 6v12M9 21v-6h6v6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  back: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  tick: 'M5 12l5 5L20 7',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  send: 'M12 19V5M5 12l7-7 7 7',
}

export function Icon({ n, s = 22, w = 1.8, c = 'currentColor' }: { n: string; s?: number; w?: number; c?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={P[n]} /></svg>
}

export function TabBar({ on }: { on: 'home' | 'planner' | 'vendors' | 'me' }) {
  const tabs = [['home', '/', 'check', '체크리스트'], ['planner', '/planner', 'spark', '플래너'], ['vendors', '/vendors', 'store', '업체'], ['me', '/me', 'user', '내 정보']]
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {tabs.map(([k, to, ic, label]) => (
        <Link key={k} to={to} className={'tab' + (on === k ? ' on' : '')} aria-current={on === k ? 'page' : undefined}><Icon n={ic} />{label}</Link>
      ))}
    </nav>
  )
}

export function Back({ label, to }: { label?: string; to?: string }) {
  const nav = useNavigate()
  return (
    <div className="top">
      <button className="icon-btn back" aria-label="뒤로" onClick={() => (to ? nav(to) : history.length > 1 ? nav(-1) : nav('/'))}><Icon n="back" /></button>
      {label && <span style={{ fontSize: 17, fontWeight: 700 }}>{label}</span>}
    </div>
  )
}

// 라디오 주파수 다이얼: 눈금자가 좌우로 움직이고 가운데 바늘이 금액을 가리킴
export function Dial({ value, onChange, label = '전체 예산 (만원)' }: { value: number; onChange: (v: number) => void; label?: string }) {
  const ticks = []
  for (let v = 1000; v <= 15000; v += 500) ticks.push(v)
  const x = -((value - 1000) / 500) * 12 - 6
  const drag = useRef<{ x: number; v: number } | null>(null)
  return (
    <div>
      <div style={{ textAlign: 'center' }}><span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1, color: 'var(--deep)' }}>{won(value)}</span><span style={{ fontSize: 18, fontWeight: 600, color: 'var(--deep)' }}> 만원</span></div>
      <div
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, v: value } }}
        onPointerMove={(e) => { if (!drag.current) return; const nv = Math.round((drag.current.v - ((e.clientX - drag.current.x) / 12) * 500) / 100) * 100; onChange(Math.min(15000, Math.max(1000, nv))) }}
        onPointerUp={() => { drag.current = null }}
        onPointerCancel={() => { drag.current = null }}
        style={{ position: 'relative', height: 84, margin: '12px -20px 0', overflow: 'hidden', background: 'var(--bg2)', touchAction: 'none', cursor: 'grab', userSelect: 'none' }}>
        <div style={{ position: 'absolute', top: 14, left: '50%', display: 'flex', transform: `translateX(${x}px)`, transition: 'transform 0.08s' }}>
          {ticks.map((v) => {
            const major = v % 1000 === 0
            return (
              <div key={v} style={{ width: 12, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 1.5, height: major ? 28 : 16, background: major ? 'var(--main)' : '#BBAFC4' }} />
                <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 4, height: 12, whiteSpace: 'nowrap' }}>{major && v % 2000 === 0 ? `${v / 1000}천` : ''}</div>
              </div>
            )
          })}
        </div>
        <div style={{ position: 'absolute', left: 'calc(50% - 1.5px)', top: 8, width: 3, height: 44, borderRadius: 2, background: 'var(--main)' }} />
        <label htmlFor="dial" className="sr">{label}</label>
        <input id="dial" className="sr" type="range" min={1000} max={15000} step={100} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 8 }}>
        <button type="button" className="step-btn" aria-label="100만원 줄이기" onClick={() => onChange(Math.max(1000, value - 100))}>−</button>
        <span className="muted" style={{ fontSize: 12 }}>좌우로 밀거나 버튼으로 조절</span>
        <button type="button" className="step-btn" aria-label="100만원 늘리기" onClick={() => onChange(Math.min(15000, value + 100))}>+</button>
      </div>
    </div>
  )
}

export function PctEditor({ budget, pct, onChange, used }: { budget: number; pct: number[]; onChange: (i: number, dl: number) => void; used?: number[] }) {
  return (
    <div>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>
        {CATS.map((c, i) => <div key={c.key} style={{ flex: pct[i], background: c.color }} />)}
      </div>
      {CATS.map((c, i) => (
        <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 52, borderBottom: '1px solid #F1ECF4' }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: c.color, flexShrink: 0 }} />
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14 }}>{c.name}</span>
            <span style={{ display: 'block', fontSize: 12, fontWeight: 700 }}>{won((budget * pct[i]) / 100)}만원{used ? <span className="muted" style={{ fontWeight: 500 }}> · {won(used[i])}만원 사용</span> : null}</span>
          </span>
          <button className="step-btn" aria-label={`${c.name} 비중 줄이기`} onClick={() => onChange(i, -5)}>−</button>
          <span style={{ width: 40, textAlign: 'center', fontWeight: 700, color: 'var(--deep)' }}>{pct[i]}%</span>
          <button className="step-btn" aria-label={`${c.name} 비중 늘리기`} onClick={() => onChange(i, 5)}>+</button>
        </div>
      ))}
    </div>
  )
}
