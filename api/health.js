import crypto from 'node:crypto'
import { sql } from './_db.js'

// 운영 점검용: DB 연결 상태와 어제(KST) 이용 지표만 숫자로 돌려준다. HEALTH_KEY 가 맞아야 응답.
export default async function handler(req, res) {
  const key = String(req.query?.key || '')
  const want = process.env.HEALTH_KEY || ''
  if (!want || key.length !== want.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(want))) return res.status(404).end()
  const t0 = Date.now()
  try {
    const [r] = await sql`
      with y as (select ((now() at time zone 'Asia/Seoul')::date - 1) as d)
      select
        (select count(*)::int from planners) as planners_total,
        (select count(*)::int from planners, y where (created_at at time zone 'Asia/Seoul')::date = y.d) as planners_yesterday,
        (select count(*)::int from members, y where (created_at at time zone 'Asia/Seoul')::date = y.d) as joins_yesterday,
        (select count(distinct planner_id)::int from (
           select planner_id, updated_at as at from tasks union all select planner_id, created_at from chats
         ) a, y where (a.at at time zone 'Asia/Seoul')::date = y.d) as active_planners_yesterday,
        (select count(*)::int from chats, y where role = 'user' and (created_at at time zone 'Asia/Seoul')::date = y.d) as ai_questions_yesterday`
    res.setHeader('cache-control', 'no-store')
    res.status(200).json({ db: 'ok', db_ms: Date.now() - t0, gemini_key: !!process.env.GEMINI_API_KEY, ...r })
  } catch (e) {
    console.error(e)
    res.status(503).json({ db: 'error', message: String(e.message || e).slice(0, 200) })
  }
}
