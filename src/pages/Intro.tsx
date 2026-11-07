import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../components'

const chip = (bg: string, c: string, b?: string) => ({ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: bg, color: c, border: b ? `1px solid ${b}` : 'none', whiteSpace: 'nowrap' as const })
const row = { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 12, padding: '10px 12px', fontSize: 13 }

function ArtBouquet() {
  return <img src="/icon-512.png" alt="" width={200} height={200} style={{ display: 'block' }} />
}

function ArtChecklist() {
  return (
    <div style={{ width: 260, background: 'var(--bg2)', borderRadius: 20, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--mid)', margin: '0 0 2px 4px' }}>2. 결혼식 준비</div>
      <div style={row}><span style={{ flex: 1, color: 'var(--faint)' }}>웨딩홀 계약</span><span style={chip('var(--bg2)', 'var(--sub)')}>완료</span></div>
      <div style={{ ...row, border: '1px solid #F2C4A8' }}><span style={{ flex: 1, fontWeight: 700 }}>스드메 계약</span><span style={chip('var(--peach-bg)', 'var(--peach-ink)', '#F2C4A8')}>8개월 전</span></div>
      <div style={row}><span style={{ flex: 1 }}>신혼여행 예약</span><span style={chip('#fff', 'var(--mid)', 'var(--line2)')}>6개월 전</span></div>
      <div style={row}><span style={{ flex: 1 }}>청첩장 제작</span><span style={chip('#fff', 'var(--mid)', 'var(--line2)')}>11주 전</span></div>
    </div>
  )
}

function ArtBudget() {
  const cats = [['웨딩홀', 60, '#7A5C8C'], ['신혼여행', 20, '#6F86A8'], ['스드메', 10, '#E89A72'], ['기타', 10, '#9DB59A']] as const
  return (
    <div style={{ width: 260, background: 'var(--bg2)', borderRadius: 20, padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--sub)' }}>예산 사용</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--deep)', margin: '2px 0 10px' }}>1,920만 <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--sub)' }}>/ 5,000만원</span></div>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 }}>{cats.map(([n, p, c]) => <div key={n} style={{ flex: p, background: c }} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px 10px', marginTop: 12, fontSize: 12 }}>
        {cats.map(([n, p, c]) => <span key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--sub)' }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{n} {p}%</span>)}
      </div>
    </div>
  )
}

function ArtPlanner() {
  return (
    <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ alignSelf: 'flex-end', background: 'var(--main)', color: '#fff', borderRadius: '16px 4px 16px 16px', padding: '10px 12px', fontSize: 13 }}>이번 달에 뭘 해야 해?</div>
      <div style={{ alignSelf: 'flex-start', background: 'var(--bg2)', borderRadius: '4px 16px 16px 16px', padding: '10px 12px', fontSize: 13, lineHeight: 1.5 }}>스드메 계약이 8주 남았어요. 견적 비교부터 같이 해볼까요?</div>
      <div style={{ alignSelf: 'center', marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid var(--line)', borderRadius: 999, padding: '8px 14px', fontSize: 12, color: 'var(--mid)' }}>
        <Icon n="user" s={16} />예비 배우자와 같은 플래너를 함께 봐요
      </div>
    </div>
  )
}

const SLIDES = [
  { art: <ArtBouquet />, title: '인생 최대의 프로젝트,\n둘이서 준비해요', body: '웨딩플래너 없이도 괜찮아요. 해야 할 일과 예산을 이생에단한번이 대신 챙겨드려요.' },
  { art: <ArtChecklist />, title: '할 일을 시기에 맞춰\n알려드려요', body: '결혼일에서 거꾸로 계산해 상견례부터 결혼 후까지 할 일을 순서대로 보여드려요.' },
  { art: <ArtBudget />, title: '예산을 정하고,\n쓴 만큼 기록해요', body: '총예산을 항목별로 나누고, 쓴 금액을 적으면 남은 예산과 초과 여부를 바로 알려드려요.' },
  { art: <ArtPlanner />, title: 'AI 플래너에게 묻고,\n둘이 함께 봐요', body: '우리 계획을 다 알고 있는 AI 플래너에게 언제든 물어보세요. 초대 링크로 예비 배우자와 함께 써요.' },
]

export default function Intro() {
  const nav = useNavigate()
  const box = useRef<HTMLDivElement>(null)
  const [i, setI] = useState(0)
  const [code, setCode] = useState('')
  const last = i === SLIDES.length - 1
  const go = (n: number) => box.current?.scrollTo({ left: n * box.current.clientWidth, behavior: 'smooth' })

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', minHeight: 44 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--main)', letterSpacing: 1 }}>이생에단한번</span>
        {!last && <button onClick={() => go(SLIDES.length - 1)} style={{ height: 40, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 14, padding: 0 }}>건너뛰기</button>}
      </div>
      <div ref={box} onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} aria-roledescription="carousel"
        style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {SLIDES.map((s, k) => (
          <section key={k} aria-label={`${k + 1} / ${SLIDES.length}`} style={{ flex: '0 0 100%', scrollSnapAlign: 'center', padding: '0 24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.art}</div>
            <h1 className="h1" style={{ whiteSpace: 'pre-line', fontSize: 26 }}>{s.title}</h1>
            <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 10 }}>{s.body}</p>
          </section>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '16px 0' }}>
        {SLIDES.map((_, k) => <button key={k} aria-label={`${k + 1}번째 안내`} onClick={() => go(k)} style={{ width: k === i ? 20 : 8, height: 8, borderRadius: 4, border: 'none', padding: 0, background: k === i ? 'var(--main)' : 'var(--line2)', transition: 'width 0.2s' }} />)}
      </div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {last ? (
          <>
            <button className="btn" onClick={() => nav('/start')}>새 플래너 시작하기</button>
            <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav('/join/' + code.trim().toUpperCase()) }} style={{ display: 'flex', gap: 8 }}>
              <label htmlFor="code" className="sr">초대 코드</label>
              <input id="code" className="input" placeholder="초대 코드로 합류하기" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" style={{ minWidth: 0 }} />
              <button className="btn-line" style={{ width: 88, flexShrink: 0 }} type="submit">합류</button>
            </form>
          </>
        ) : (
          <button className="btn" onClick={() => go(i + 1)}>다음</button>
        )}
      </div>
    </div>
  )
}
