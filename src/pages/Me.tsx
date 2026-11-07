import { useState } from 'react'
import { useStore } from '../store'
import { TabBar } from '../components'

export default function Me() {
  const { planner: p, patchPlanner, leave, toast } = useStore()
  const [date, setDate] = useState(p?.wedding_date || '')
  if (!p) return null
  const link = `${location.origin}/join/${p.invite_code}`

  const share = async () => {
    const text = `우리 결혼 준비, 이생에단한번에서 같이 해요.\n${link}`
    try {
      if (navigator.share) await navigator.share({ title: '이생에단한번 초대', text })
      else { await navigator.clipboard.writeText(link); toast('초대 링크를 복사했어요') }
    } catch {}
  }

  return (
    <>
      <div className="page">
        <h1 className="h1" style={{ fontSize: 22, paddingTop: 8 }}>내 정보</h1>

        <div className="card">
          <h2 className="h2" style={{ fontSize: 16 }}>함께 준비하기</h2>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '6px 0 12px' }}>{p.members > 1 ? `${p.members}명이 이 플래너를 함께 보고 있어요.` : '예비 배우자를 초대하면 같은 체크리스트와 예산을 함께 봐요.'}</p>
          <button className="btn" onClick={share}>초대 링크 보내기</button>
          <div className="muted" style={{ fontSize: 13, marginTop: 10 }}>초대 코드 <b style={{ color: 'var(--deep)', letterSpacing: 1 }}>{p.invite_code}</b></div>
        </div>

        <div className="card">
          <label htmlFor="wd" className="h2" style={{ fontSize: 16, display: 'block' }}>결혼 예정일</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input id="wd" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} style={{ background: "#fff", flex: 1, minWidth: 0 }} />
            <button className="btn-line" style={{ width: 80, flexShrink: 0 }} onClick={() => { patchPlanner({ wedding_date: date || null }); toast('저장했어요') }}>저장</button>
          </div>
          {p.wedding_date && <button onClick={() => { setDate(''); patchPlanner({ wedding_date: null }) }} style={{ marginTop: 8, height: 36, border: 'none', background: 'transparent', color: 'var(--sub)', fontSize: 13, padding: 0 }}>아직 미정으로 바꾸기</button>}
        </div>

        <div className="card">
          <h2 className="h2" style={{ fontSize: 16 }}>다른 기기에서 열기</h2>
          <p className="muted" style={{ fontSize: 14, lineHeight: 1.6, margin: '6px 0 0' }}>로그인 없이 쓰는 플래너예요. 휴대폰을 바꾸거나 다른 기기에서 열 때는 초대 코드 <b>{p.invite_code}</b>로 다시 합류하면 돼요. 코드는 꼭 따로 적어두세요.</p>
        </div>

        <button className="btn-line" style={{ color: 'var(--danger)', borderColor: '#EBC9C9' }} onClick={() => { if (confirm('이 기기에서 플래너를 닫을까요? 초대 코드로 다시 들어올 수 있어요.')) leave() }}>이 기기에서 나가기</button>
      </div>
      <TabBar on="me" />
    </>
  )
}
