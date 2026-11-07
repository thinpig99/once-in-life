import { sql, auth, loadPlanner, newToken, newCode, hash, validPct, validDate } from './_db.js'

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { wedding_date = null, budget = 5000, pct = [60, 20, 10, 10] } = req.body || {}
      if (!validDate(wedding_date) || !Number.isInteger(budget) || budget < 100 || budget > 100000 || !validPct(pct)) {
        return res.status(400).json({ error: '입력값을 확인해 주세요.' })
      }
      const [p] = await sql`insert into planners (wedding_date, budget, pct, invite_code) values (${wedding_date}, ${budget}, ${pct}, ${newCode()}) returning id`
      const token = newToken()
      await sql`insert into members (token_hash, planner_id) values (${hash(token)}, ${p.id})`
      return res.status(200).json({ token, planner: await loadPlanner(p.id) })
    }

    const id = await auth(req)
    if (!id) return res.status(401).json({ error: '플래너에 다시 접속해 주세요.' })

    if (req.method === 'GET') return res.status(200).json({ planner: await loadPlanner(id) })

    if (req.method === 'PATCH') {
      const b = req.body || {}
      if ('wedding_date' in b) {
        if (!validDate(b.wedding_date)) return res.status(400).json({ error: '날짜를 확인해 주세요.' })
        await sql`update planners set wedding_date = ${b.wedding_date} where id = ${id}`
      }
      if ('budget' in b) {
        if (!Number.isInteger(b.budget) || b.budget < 100 || b.budget > 100000) return res.status(400).json({ error: '예산을 확인해 주세요.' })
        await sql`update planners set budget = ${b.budget} where id = ${id}`
      }
      if ('pct' in b) {
        if (!validPct(b.pct)) return res.status(400).json({ error: '비중 합계가 100%가 되어야 해요.' })
        await sql`update planners set pct = ${b.pct} where id = ${id}`
      }
      return res.status(200).json({ planner: await loadPlanner(id) })
    }

    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
