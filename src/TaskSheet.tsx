import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AXES, CATS, PHASES, TASKS, timingLabel } from '../shared/catalog.js'
import { OFFSET_CHOICES, type Item } from './lib'
import { useStore } from './store'

const seg = (on: boolean) => ({ flex: 1, minHeight: 40, border: 'none', borderRadius: 10, background: on ? '#fff' : 'transparent', color: on ? 'var(--deep)' : 'var(--sub)', fontWeight: on ? 700 : 500, fontSize: 13, padding: '0 4px' })
const pill = (on: boolean, c = '#7A5C8C') => ({ minHeight: 36, padding: '0 12px', borderRadius: 999, border: `1px solid ${on ? c : 'var(--line2)'}`, background: on ? c : '#fff', color: on ? '#fff' : 'var(--mid)', fontSize: 13, fontWeight: on ? 700 : 500 })
const lbl = { display: 'block', fontSize: 12, color: 'var(--sub)', margin: '14px 0 6px' }

// item 이 없으면 새 할 일 추가, 있으면 편집
export default function TaskSheet({ item, phase = 1, onClose }: { item?: Item; phase?: number; onClose: () => void }) {
  const { patchTask, addCustom, editCustom, removeCustom } = useStore()
  const nav = useNavigate()
  const isNew = !item
  const isCustom = !item || item.custom
  const base = item && !item.custom ? TASKS.find((t) => t.key === item.key) : null
  const [name, setName] = useState(item?.name || '')
  const [ph, setPh] = useState(item?.phase ?? phase)
  const [axis, setAxis] = useState(item?.axis || 'wed')
  const [offset, setOffset] = useState(item?.offset ?? [-365, -150, -30, 14][phase] ?? -90)
  const [cat, setCat] = useState<string | null>(item?.cat ?? null)
  const [subs, setSubs] = useState<string[]>(item ? [...item.subs] : [])
  const [err, setErr] = useState('')
  const choices = OFFSET_CHOICES.some(([v]) => v === offset) ? OFFSET_CHOICES : [...OFFSET_CHOICES, [offset, timingLabel(offset)] as [number, string]].sort((a, b) => a[0] - b[0])

  const save = async () => {
    const n = name.trim()
    if (!n) { setErr('할 일 이름을 적어 주세요.'); return }
    const cleanSubs = subs.map((s) => s.trim()).filter(Boolean).slice(0, 10)
    if (isNew) {
      const key = await addCustom({ phase: ph, name: n, offset_days: offset, axis, cat, sub_names: cleanSubs })
      if (key) onClose()
      return
    }
    if (item!.custom) await editCustom(item!.key, { phase: ph, name: n, offset_days: offset, axis, cat, sub_names: cleanSubs })
    else await patchTask(item!.key, {
      name: n === base!.name ? null : n,
      offset_days: offset === base!.offset ? null : offset,
      sub_names: JSON.stringify(cleanSubs) === JSON.stringify(base!.subs) ? null : cleanSubs,
    })
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={isNew ? '할 일 추가' : '할 일 편집'} onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(53,46,58,0.4)', zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, maxHeight: '88dvh', overflowY: 'auto', background: '#fff', borderRadius: '24px 24px 0 0', padding: '18px 20px calc(24px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 18, fontWeight: 800 }}>{isNew ? '할 일 추가' : '할 일 편집'}</span>
          <button onClick={onClose} style={{ height: 40, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 14 }}>닫기</button>
        </div>

        <label htmlFor="tname" style={lbl}>이름</label>
        <input id="tname" className="input" value={name} maxLength={40} onChange={(e) => { setName(e.target.value); setErr('') }} placeholder="예: 웨딩 피부관리" />
        {err && <div role="alert" style={{ fontSize: 13, color: 'var(--danger)', marginTop: 6 }}>{err}</div>}

        {isCustom && (
          <>
            <span style={lbl}>단계</span>
            <div role="group" aria-label="단계" style={{ display: 'flex', gap: 4, background: 'var(--bg2)', borderRadius: 12, padding: 4 }}>
              {PHASES.map((p, i) => <button key={p} aria-pressed={ph === i} onClick={() => setPh(i)} style={seg(ph === i)}>{p.replace('결혼 의사 및 ', '').replace('결혼식 ', '')}</button>)}
            </div>
            <span style={lbl}>축</span>
            <div role="group" aria-label="축" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AXES.map((a) => <button key={a.key} aria-pressed={axis === a.key} onClick={() => setAxis(a.key)} style={pill(axis === a.key, a.color)}>{a.name}</button>)}
            </div>
          </>
        )}

        <label htmlFor="toff" style={lbl}>언제까지</label>
        <select id="toff" className="input" value={offset} onChange={(e) => setOffset(Number(e.target.value))} style={{ appearance: 'auto' }}>
          {choices.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {base && offset !== base.offset && <button onClick={() => setOffset(base.offset)} style={{ marginTop: 6, height: 32, border: 'none', background: 'transparent', color: 'var(--main)', fontSize: 12, fontWeight: 600, padding: 0 }}>추천 시기로 ({timingLabel(base.offset)})</button>}

        {isCustom && (
          <>
            <span style={lbl}>예산 항목</span>
            <div role="group" aria-label="예산 항목" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {CATS.map((c) => <button key={c.key} aria-pressed={cat === c.key} onClick={() => setCat(c.key)} style={pill(cat === c.key)}>{c.name.replace(/\(.*\)/, '')}</button>)}
              <button aria-pressed={cat === null} onClick={() => setCat(null)} style={pill(cat === null)}>없음</button>
            </div>
          </>
        )}

        <span style={lbl}>세부 할 일</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {subs.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 6 }}>
              <label htmlFor={`sub${i}`} className="sr">세부 할 일 {i + 1}</label>
              <input id={`sub${i}`} className="input" value={s} maxLength={60} onChange={(e) => setSubs(subs.map((x, k) => (k === i ? e.target.value : x)))} style={{ height: 44, fontSize: 15, minWidth: 0 }} />
              <button aria-label={`세부 할 일 ${i + 1} 삭제`} onClick={() => setSubs(subs.filter((_, k) => k !== i))} style={{ width: 44, flexShrink: 0, border: '1px solid var(--line2)', borderRadius: 12, background: '#fff', color: 'var(--sub)', fontSize: 18 }}>−</button>
            </div>
          ))}
          {subs.length < 10 && <button onClick={() => setSubs([...subs, ''])} style={{ minHeight: 44, border: '1.5px dashed var(--line2)', borderRadius: 12, background: 'transparent', color: 'var(--main)', fontWeight: 700, fontSize: 14 }}>+ 세부 할 일 추가</button>}
        </div>

        <button className="btn" style={{ marginTop: 20 }} onClick={save}>{isNew ? '추가하기' : '저장하기'}</button>

        {!isNew && !item!.custom && (
          <button className="btn-line" style={{ marginTop: 8 }} onClick={async () => { await patchTask(item!.key, { hidden: !item!.hidden }); onClose(); if (!item!.hidden) nav('/', { replace: true }) }}>
            {item!.hidden ? '다시 보이기' : '우리는 안 해요 · 숨기기'}
          </button>
        )}
        {!isNew && item!.custom && (
          <button className="btn-line" style={{ marginTop: 8, color: 'var(--danger)', borderColor: '#EBC9C9' }} onClick={async () => { if (confirm('이 할 일을 삭제할까요?')) { await removeCustom(item!.key); onClose(); nav('/', { replace: true }) } }}>삭제하기</button>
        )}
        {!isNew && !item!.custom && <p className="muted" style={{ fontSize: 12, lineHeight: 1.5, marginTop: 10 }}>숨긴 항목은 진행률과 AI 플래너에서 빠지고, 체크리스트 아래 "숨긴 항목"에서 언제든 되살릴 수 있어요.</p>}
      </div>
    </div>
  )
}
