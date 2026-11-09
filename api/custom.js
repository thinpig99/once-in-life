import crypto from 'node:crypto'
import { sql, auth } from './_db.js'
import { AXES, CATS } from '../shared/catalog.js'

const okSubs = (s) => Array.isArray(s) && s.length <= 10 && s.every((x) => typeof x === 'string' && x.trim() && x.length <= 60)

export default async function handler(req, res) {
  try {
    const id = await auth(req)
    if (!id) return res.status(401).json({ error: '플래너에 다시 접속해 주세요.' })
    const b = req.body || {}

    if (req.method === 'POST') {
      const name = String(b.name || '').trim()
      if (!name || name.length > 40) return res.status(400).json({ error: '이름을 40자 안으로 적어 주세요.' })
      if (![0, 1, 2, 3].includes(b.phase)) return res.status(400).json({ error: '단계를 골라 주세요.' })
      if (!Number.isInteger(b.offset_days) || b.offset_days < -800 || b.offset_days > 400) return res.status(400).json({ error: '시기를 확인해 주세요.' })
      if (!AXES.some((a) => a.key === b.axis)) return res.status(400).json({ error: '축을 골라 주세요.' })
      if (b.cat != null && !CATS.some((c) => c.key === b.cat)) return res.status(400).json({ error: '예산 항목을 확인해 주세요.' })
      const subs = b.sub_names ?? []
      if (!okSubs(subs)) return res.status(400).json({ error: '세부 할 일을 확인해 주세요.' })
      const [{ n }] = await sql`select count(*)::int as n from custom_tasks where planner_id = ${id}`
      if (n >= 100) return res.status(400).json({ error: '직접 추가한 할 일은 100개까지예요.' })
      const key = 'c_' + crypto.randomBytes(6).toString('hex')
      const [row] = await sql`insert into custom_tasks (planner_id, key, phase, name, offset_days, axis, cat, sub_names)
        values (${id}, ${key}, ${b.phase}, ${name}, ${b.offset_days}, ${b.axis}, ${b.cat ?? null}, ${JSON.stringify(subs.map((s) => s.trim()))}::jsonb)
        returning key, phase, name, offset_days, axis, cat, sub_names`
      return res.status(200).json({ custom: row })
    }

    if (req.method === 'PATCH') {
      const key = String(b.key || '')
      const [cur] = await sql`select key from custom_tasks where planner_id = ${id} and key = ${key}`
      if (!cur) return res.status(404).json({ error: '없는 항목이에요.' })
      if ('name' in b && (!String(b.name || '').trim() || b.name.length > 40)) return res.status(400).json({ error: '이름을 확인해 주세요.' })
      if ('phase' in b && ![0, 1, 2, 3].includes(b.phase)) return res.status(400).json({ error: '단계를 확인해 주세요.' })
      if ('offset_days' in b && (!Number.isInteger(b.offset_days) || b.offset_days < -800 || b.offset_days > 400)) return res.status(400).json({ error: '시기를 확인해 주세요.' })
      if ('axis' in b && !AXES.some((a) => a.key === b.axis)) return res.status(400).json({ error: '축을 확인해 주세요.' })
      if ('cat' in b && b.cat != null && !CATS.some((c) => c.key === b.cat)) return res.status(400).json({ error: '예산 항목을 확인해 주세요.' })
      if ('sub_names' in b && !okSubs(b.sub_names)) return res.status(400).json({ error: '세부 할 일을 확인해 주세요.' })
      const [row] = await sql`update custom_tasks set
          name = coalesce(${'name' in b ? String(b.name).trim() : null}, name),
          phase = coalesce(${'phase' in b ? b.phase : null}::smallint, phase),
          offset_days = coalesce(${'offset_days' in b ? b.offset_days : null}::int, offset_days),
          axis = coalesce(${'axis' in b ? b.axis : null}, axis),
          cat = case when ${'cat' in b}::boolean then ${b.cat ?? null} else cat end,
          sub_names = coalesce(${'sub_names' in b ? JSON.stringify(b.sub_names.map((s) => s.trim())) : null}::jsonb, sub_names)
        where planner_id = ${id} and key = ${key}
        returning key, phase, name, offset_days, axis, cat, sub_names`
      return res.status(200).json({ custom: row })
    }

    if (req.method === 'DELETE') {
      const key = String(b.key || '')
      await sql`delete from custom_tasks where planner_id = ${id} and key = ${key}`
      await sql`delete from tasks where planner_id = ${id} and key = ${key}`
      return res.status(200).json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
