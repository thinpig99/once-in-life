import { sql, auth } from './_db.js'
import { TASKS } from '../shared/catalog.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()
  try {
    const id = await auth(req)
    if (!id) return res.status(401).json({ error: '플래너에 다시 접속해 주세요.' })
    const { key, status, spent, memo, subs } = req.body || {}
    const def = TASKS.find((t) => t.key === key)
    if (!def) return res.status(400).json({ error: '없는 항목이에요.' })
    if (status !== undefined && ![0, 1, 2].includes(status)) return res.status(400).json({ error: '상태값 오류' })
    if (spent !== undefined && (!Number.isInteger(spent) || spent < 0 || spent > 100000)) return res.status(400).json({ error: '금액을 확인해 주세요.' })
    if (memo !== undefined && (typeof memo !== 'string' || memo.length > 2000)) return res.status(400).json({ error: '메모가 너무 길어요.' })
    if (subs !== undefined && (!Array.isArray(subs) || subs.length > def.subs.length || !subs.every((x) => typeof x === 'boolean'))) return res.status(400).json({ error: '세부 할 일 오류' })

    const [cur] = await sql`select status, spent, memo, subs from tasks where planner_id = ${id} and key = ${key}`
    const next = {
      status: status ?? cur?.status ?? 0,
      spent: spent ?? cur?.spent ?? 0,
      memo: memo ?? cur?.memo ?? '',
      subs: subs ?? cur?.subs ?? [],
    }
    const [row] = await sql`
      insert into tasks (planner_id, key, status, spent, memo, subs, updated_at)
      values (${id}, ${key}, ${next.status}, ${next.spent}, ${next.memo}, ${JSON.stringify(next.subs)}::jsonb, now())
      on conflict (planner_id, key) do update set status = excluded.status, spent = excluded.spent, memo = excluded.memo, subs = excluded.subs, updated_at = now()
      returning key, status, spent, memo, subs`
    res.status(200).json({ task: row })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
