import { sql, auth, loadPlanner } from './_db.js'
import { TASKS, CATS, PHASES, STATUS, timingLabel } from '../shared/catalog.js'

function context(p) {
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)
  const byKey = Object.fromEntries(p.tasks.map((t) => [t.key, t]))
  const dday = p.wedding_date ? Math.round((new Date(p.wedding_date) - new Date(today)) / 86400e3) : null
  const lines = [
    `오늘: ${today}`,
    `결혼 예정일: ${p.wedding_date ? `${p.wedding_date} (D-${dday})` : '미정'}`,
    `총 예산: ${p.budget}만원`,
    `항목별 예산: ${CATS.map((c, i) => {
      const used = TASKS.filter((t) => t.cat === c.key).reduce((a, t) => a + (byKey[t.key]?.spent || 0), 0)
      return `${c.name} ${Math.round((p.budget * p.pct[i]) / 100)}만원 중 ${used}만원 사용`
    }).join(', ')}`,
    '체크리스트:',
  ]
  PHASES.forEach((ph, i) => {
    lines.push(`[${ph}]`)
    TASKS.filter((t) => t.phase === i).forEach((t) => {
      const s = byKey[t.key]
      const subsDone = (s?.subs || []).filter(Boolean).length
      let line = `- ${t.name} (권장 ${timingLabel(t.offset)}): ${STATUS[s?.status || 0]}, 세부 ${subsDone}/${t.subs.length}`
      if (s?.spent) line += `, 사용 ${s.spent}만원`
      if (s?.memo) line += `, 메모: ${s.memo.slice(0, 200)}`
      lines.push(line)
    })
  })
  return lines.join('\n')
}

export default async function handler(req, res) {
  try {
    const id = await auth(req)
    if (!id) return res.status(401).json({ error: '플래너에 다시 접속해 주세요.' })

    if (req.method === 'GET') {
      const rows = await sql`select role, text from (select id, role, text from chats where planner_id = ${id} order by id desc limit 50) x order by id`
      return res.status(200).json({ messages: rows })
    }
    if (req.method !== 'POST') return res.status(405).end()

    const text = String(req.body?.text || '').trim()
    if (!text || text.length > 1000) return res.status(400).json({ error: '메시지를 확인해 주세요.' })
    if (!process.env.GEMINI_API_KEY) return res.status(503).json({ error: 'AI 플래너 설정이 아직 안 됐어요.' })

    const p = await loadPlanner(id)
    const history = await sql`select role, text from (select id, role, text from chats where planner_id = ${id} order by id desc limit 12) x order by id`
    const system = `너는 셀프 웨딩 앱 '이생에단한번'의 AI 웨딩플래너야. 예비부부가 함께 쓰는 플래너야.
아래 커플의 현재 계획과 진행 상황을 참고해서, 한국 결혼 준비 관행에 맞게 구체적이고 실용적으로 답해.
친절한 존댓말로, 짧은 문단이나 번호 목록으로 간결하게 답해. 이모지는 쓰지 마.
모르는 업체명이나 가격을 지어내지 말고, 확인이 필요한 건 확인하라고 안내해.

${context(p)}`
    const contents = [...history, { role: 'user', text }].map((m) => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.text }] }))
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents }),
    })
    const data = await r.json()
    if (!r.ok) {
      console.error('gemini', r.status, JSON.stringify(data).slice(0, 500))
      return res.status(502).json({ error: r.status === 429 ? '오늘 AI 사용량이 많아요. 잠시 후 다시 물어봐 주세요.' : 'AI 플래너가 잠시 답할 수 없어요.' })
    }
    const reply = data.candidates?.[0]?.content?.parts?.map((x) => x.text || '').join('').trim() || '답변을 만들지 못했어요. 다시 물어봐 주세요.'
    await sql`insert into chats (planner_id, role, text) values (${id}, 'user', ${text}), (${id}, 'model', ${reply})`
    res.status(200).json({ reply })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
