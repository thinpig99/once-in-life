import { useEffect, useState } from 'react'

export type Step = { name: string; song: string }

// 일반적인 예식 순서. 노래가 필요한 순서에는 music 표시
export const DEFAULT_STEPS: [string, boolean][] = [
  ['개식 선언', false], ['화촉 점화', true], ['신랑 입장', true], ['신부 입장', true], ['맞절', false],
  ['혼인 서약', false], ['성혼 선언문 낭독', false], ['덕담·주례사', false], ['축사', false], ['축가', true],
  ['양가 부모님께 인사', true], ['하객께 인사', false], ['신랑신부 행진', true], ['기념 촬영', false],
]
const fresh = (): Step[] => DEFAULT_STEPS.map(([name]) => ({ name, song: '' }))
const musical = (n: string) => DEFAULT_STEPS.find(([x]) => x === n)?.[1] ?? true

export default function CeremonyOrder({ value, onSave }: { value?: Step[]; onSave: (steps: Step[]) => void }) {
  const [steps, setSteps] = useState<Step[]>(value?.length ? value : fresh())
  useEffect(() => { if (value?.length) setSteps(value) }, [JSON.stringify(value)])
  const commit = (n: Step[]) => { setSteps(n); onSave(n) }
  const set = (i: number, k: keyof Step, v: string) => setSteps(steps.map((s, j) => (j === i ? { ...s, [k]: v } : s)))
  const move = (i: number, d: number) => { const j = i + d; if (j < 0 || j >= steps.length) return; const n = steps.slice(); [n[i], n[j]] = [n[j], n[i]]; commit(n) }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span className="h2" style={{ fontSize: 16 }}>우리 식순</span>
        <button onClick={() => { if (confirm('기본 식순으로 되돌릴까요? 입력한 노래도 지워져요.')) commit(fresh()) }} style={{ height: 32, border: 'none', background: 'transparent', color: 'var(--main)', fontSize: 12, fontWeight: 600, padding: 0 }}>기본 식순으로</button>
      </div>
      <p className="muted" style={{ fontSize: 12, margin: '0 0 10px', lineHeight: 1.5 }}>일반적인 순서로 채워 두었어요. 순서 이름을 고치거나 위아래로 옮기고, 오른쪽에 쓸 노래를 적어 주세요.</p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg2)', borderRadius: 12, padding: '6px 6px 6px 10px' }}>
            <span style={{ width: 20, fontSize: 12, fontWeight: 700, color: 'var(--main)', textAlign: 'center', flexShrink: 0 }}>{i + 1}</span>
            <label htmlFor={`stp${i}`} className="sr">{i + 1}번 순서 이름</label>
            <input id={`stp${i}`} value={s.name} maxLength={30} onChange={(e) => set(i, 'name', e.target.value)} onBlur={() => onSave(steps)}
              style={{ flex: '1 1 40%', minWidth: 0, height: 36, border: 'none', background: 'transparent', fontSize: 14, fontWeight: 600, padding: 0 }} />
            <label htmlFor={`sng${i}`} className="sr">{s.name} 노래</label>
            <input id={`sng${i}`} value={s.song} maxLength={60} onChange={(e) => set(i, 'song', e.target.value)} onBlur={() => onSave(steps)} placeholder={musical(s.name) ? '노래 입력' : '-'}
              style={{ flex: '1 1 45%', minWidth: 0, height: 36, border: '1px solid var(--line)', borderRadius: 8, background: '#fff', fontSize: 13, padding: '0 8px' }} />
            <span style={{ display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
              <button aria-label={`${s.name} 위로`} onClick={() => move(i, -1)} style={{ width: 28, height: 18, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 10, padding: 0 }}>▲</button>
              <button aria-label={`${s.name} 아래로`} onClick={() => move(i, 1)} style={{ width: 28, height: 18, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 10, padding: 0 }}>▼</button>
            </span>
            <button aria-label={`${s.name} 삭제`} onClick={() => commit(steps.filter((_, j) => j !== i))} style={{ width: 28, height: 36, border: 'none', background: 'transparent', color: 'var(--faint)', fontSize: 16, padding: 0, flexShrink: 0 }}>×</button>
          </li>
        ))}
      </ol>
      {steps.length < 30 && <button onClick={() => commit([...steps, { name: '새 순서', song: '' }])} style={{ width: '100%', minHeight: 44, marginTop: 6, border: '1.5px dashed var(--line2)', borderRadius: 12, background: 'transparent', color: 'var(--main)', fontWeight: 700, fontSize: 14 }}>+ 순서 추가</button>}
    </div>
  )
}
