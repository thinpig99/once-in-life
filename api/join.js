import { sql, loadPlanner, newToken, hash } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const code = String(req.body?.code || '').trim().toUpperCase()
    if (!/^[A-Z0-9]{5,10}$/.test(code)) return res.status(400).json({ error: '초대 코드를 확인해 주세요.' })
    const [p] = await sql`select id from planners where invite_code = ${code}`
    if (!p) return res.status(404).json({ error: '초대 코드를 찾을 수 없어요.' })
    const token = newToken()
    await sql`insert into members (token_hash, planner_id) values (${hash(token)}, ${p.id})`
    res.status(200).json({ token, planner: await loadPlanner(p.id) })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
