import { Link } from 'react-router-dom'
import { TASKS, timingLabel } from '../../shared/catalog.js'
import { useStore } from '../store'
import { stateOf } from '../lib'
import { TabBar } from '../components'

const CATS = ['웨딩홀', '스드메', '스냅·영상', '신혼여행', '예물', '한복·예복', '청첩장']

export default function Vendors() {
  const { planner: p } = useStore()
  if (!p) return null
  const now = [...TASKS].sort((a, b) => a.offset - b.offset).find((t) => t.cat && stateOf(p, t.key).status !== 2)
  return (
    <>
      <div className="page">
        <h1 className="h1" style={{ fontSize: 22, paddingTop: 8 }}>업체</h1>
        {now && (
          <Link to={`/task/${now.key}`} style={{ display: 'block', background: 'var(--deep)', borderRadius: 20, padding: 16, color: '#fff' }}>
            <div style={{ fontSize: 12, color: '#E3D6EB' }}>지금 필요한 업체</div>
            <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>{now.name} · {timingLabel(now.offset)}</div>
          </Link>
        )}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CATS.map((c) => <span key={c} className="chip" style={{ height: 36, padding: '0 14px', background: '#fff', color: 'var(--mid)', border: '1px solid var(--line2)', fontWeight: 500, fontSize: 13 }}>{c}</span>)}
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>업체 추천을 준비하고 있어요</div>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '8px 0 0' }}>내 예산 안에 들어오는 업체를 비교하고, 제휴 혜택가로 상담받을 수 있게 만들고 있어요. 그 전까지는 AI 플래너에게 고르는 기준을 물어보세요.</p>
          <Link to="/planner" className="btn" style={{ marginTop: 16 }}>플래너에게 물어보기</Link>
        </div>
      </div>
      <TabBar on="vendors" />
    </>
  )
}
