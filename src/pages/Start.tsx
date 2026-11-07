import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { recommendedPct } from '../../shared/catalog.js'
import { api, adjustPct, daysTo } from '../lib'
import { useStore } from '../store'
import { Dial, Icon, PctEditor } from '../components'

export function Welcome() {
  const nav = useNavigate()
  const [code, setCode] = useState('')
  return (
    <div className="page" style={{ minHeight: '100dvh', justifyContent: 'space-between', paddingBottom: 32 }}>
      <div style={{ paddingTop: '18vh' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--main)', letterSpacing: 2 }}>이생에단한번</div>
        <h1 className="h1" style={{ fontSize: 30, marginTop: 12 }}>인생 최대의 프로젝트,<br />AI 플래너와 함께<br />둘이서 준비해요</h1>
        <p className="muted" style={{ fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>해야 할 일을 시기에 맞춰 알려드리고, 예산과 진행 상황을 함께 챙겨요.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button className="btn" onClick={() => nav('/start')}>새 플래너 시작하기</button>
        <form onSubmit={(e) => { e.preventDefault(); if (code.trim()) nav('/join/' + code.trim().toUpperCase()) }} style={{ display: 'flex', gap: 8 }}>
          <label htmlFor="code" className="sr">초대 코드</label>
          <input id="code" className="input" placeholder="초대 코드로 합류하기" value={code} onChange={(e) => setCode(e.target.value)} autoCapitalize="characters" />
          <button className="btn-line" style={{ width: 88, flexShrink: 0 }} type="submit">합류</button>
        </form>
      </div>
    </div>
  )
}

export function Onboarding() {
  const nav = useNavigate()
  const { start, toast } = useStore()
  const [step, setStep] = useState(1)
  const [date, setDate] = useState('')
  const [undecided, setUndecided] = useState(false)
  const [budget, setBudget] = useState(5000)
  const [custom, setCustom] = useState<number[] | null>(null)
  const [busy, setBusy] = useState(false)
  const pct = custom || recommendedPct(budget)
  const days = date ? daysTo(date) : null

  const create = async () => {
    setBusy(true)
    try {
      const d = await api('planner', 'POST', { wedding_date: undecided || !date ? null : date, budget, pct })
      start(d.token, d.planner)
      nav('/', { replace: true })
    } catch (e: any) { toast(e.message); setBusy(false) }
  }

  return (
    <div className="page" style={{ minHeight: '100dvh', paddingBottom: 110 }}>
      <div className="top" style={{ gap: 8 }}>
        <button className="icon-btn back" aria-label="이전" onClick={() => (step > 1 ? setStep(1) : nav('/'))}><Icon n="back" /></button>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>{[1, 2].map((i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= step ? 'var(--main)' : 'var(--soft)' }} />)}</div>
        <span className="muted small" style={{ width: 32, textAlign: 'right' }}>{step}/2</span>
      </div>

      {step === 1 ? (
        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column' }}>
          <h1 className="h1">결혼식은<br />언제로 생각하세요?</h1>
          <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>날짜에 맞춰 할 일 일정을 거꾸로 계산해 드려요.</p>
          {!undecided ? (
            <>
              <label htmlFor="wdate" className="muted small" style={{ marginTop: 32, marginBottom: 8 }}>예정일</label>
              <div style={{ position: "relative" }}>
                <input id="wdate" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
                {!date && <span aria-hidden="true" style={{ position: "absolute", left: 16, top: 0, lineHeight: "52px", color: "var(--faint)", pointerEvents: "none", fontSize: 16 }}>날짜를 선택해 주세요</span>}
              </div>
              {days !== null && <div style={{ fontSize: 13, color: 'var(--main)', fontWeight: 600, marginTop: 10 }}>{days > 0 ? `D-${days} · 함께 차근차근 준비해요` : '날짜를 다시 확인해 주세요'}</div>}
            </>
          ) : (
            <div className="card" style={{ marginTop: 32, fontSize: 14, lineHeight: 1.6, color: '#4A3757' }}>괜찮아요. 날짜 없이 순서대로 안내하다가, 날짜가 정해지면 내 정보에서 입력해 주세요. 일정을 자동으로 맞춰 드릴게요.</div>
          )}
          <button onClick={() => setUndecided(!undecided)} aria-pressed={undecided} style={{ marginTop: 16, minHeight: 48, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: 10, padding: 0, fontSize: 15 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: '1.5px solid var(--check)', background: undecided ? 'var(--main)' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon n="tick" s={12} w={3} /></span>
            아직 날짜를 정하지 않았어요
          </button>
        </div>
      ) : (
        <div style={{ paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <h1 className="h1">전체 예산은<br />어느 정도인가요?</h1>
            <p className="muted" style={{ fontSize: 14, margin: '8px 0 0' }}>다이얼로 총액을, 아래에서 항목별 비중을 정해요.</p>
          </div>
          <Dial value={budget} onChange={setBudget} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span className="muted small">항목별 비중 조절</span>
            <button onClick={() => setCustom(null)} style={{ height: 32, border: 'none', background: 'transparent', color: 'var(--main)', fontSize: 12, fontWeight: 600, padding: 0 }}>추천 비중으로</button>
          </div>
          <PctEditor budget={budget} pct={pct} onChange={(i, dl) => setCustom(adjustPct(pct, i, dl))} />
        </div>
      )}

      <div className="bottom-cta">
        {step === 1
          ? <button className="btn" disabled={!undecided && !(days !== null && days > 0)} onClick={() => setStep(2)}>다음</button>
          : <button className="btn" disabled={busy} onClick={create}>{busy ? '만드는 중…' : '우리 체크리스트 만들기'}</button>}
      </div>
    </div>
  )
}

export function Join() {
  const { code } = useParams()
  const nav = useNavigate()
  const { start, planner } = useStore()
  const [err, setErr] = useState('')
  useEffect(() => {
    if (planner) { nav('/', { replace: true }); return }
    api('join', 'POST', { code }).then((d) => { start(d.token, d.planner); nav('/', { replace: true }) }).catch((e) => setErr(e.message))
  }, [])
  return (
    <div className="page" style={{ paddingTop: '30vh', textAlign: 'center' }}>
      {err ? <><p style={{ fontSize: 16, fontWeight: 700 }}>{err}</p><button className="btn-line" onClick={() => nav('/', { replace: true })}>처음으로</button></> : <div className="spin" style={{ margin: '0 auto' }} aria-label="합류하는 중" />}
    </div>
  )
}
