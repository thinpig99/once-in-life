import { sql, auth } from './_db.js'
import { TASKS } from '../shared/catalog.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') return res.status(405).end()
  try {
    const id = await auth(req)
    if (!id) return res.status(401).json({ error: '플래너에 다시 접속해 주세요.' })
    const b = req.body || {}
    const { key, status, spent, memo, subs } = b
    let def = TASKS.find((t) => t.key === key)
    if (!def && typeof key === 'string' && key.startsWith('c_')) {
      const [c] = await sql`select sub_names from custom_tasks where planner_id = ${id} and key = ${key}`
      if (c) def = { key, subs: c.sub_names || [], custom: true }
    }
    if (!def) return res.status(400).json({ error: '없는 항목이에요.' })
    if ('hidden' in b && typeof b.hidden !== 'boolean') return res.status(400).json({ error: '숨김 값 오류' })
    if ('name' in b && b.name !== null && (typeof b.name !== 'string' || !b.name.trim() || b.name.length > 40)) return res.status(400).json({ error: '이름을 40자 안으로 적어 주세요.' })
    if ('offset_days' in b && b.offset_days !== null && (!Number.isInteger(b.offset_days) || b.offset_days < -800 || b.offset_days > 400)) return res.status(400).json({ error: '시기를 확인해 주세요.' })
    if ('sub_names' in b && b.sub_names !== null && (!Array.isArray(b.sub_names) || b.sub_names.length > 10 || !b.sub_names.every((x) => typeof x === 'string' && x.trim() && x.length <= 60))) return res.status(400).json({ error: '세부 할 일을 확인해 주세요.' })
    if ('extra' in b && b.extra !== null && (typeof b.extra !== 'object' || Array.isArray(b.extra) || JSON.stringify(b.extra).length > 5000)) return res.status(400).json({ error: '내용이 너무 길어요.' })
    if (status !== undefined && ![0, 1, 2].includes(status)) return res.status(400).json({ error: '상태값 오류' })
    if (spent !== undefined && (!Number.isInteger(spent) || spent < 0 || spent > 100000)) return res.status(400).json({ error: '금액을 확인해 주세요.' })
    if (memo !== undefined && (typeof memo !== 'string' || memo.length > 2000)) return res.status(400).json({ error: '메모가 너무 길어요.' })
    if (subs !== undefined && (!Array.isArray(subs) || subs.length > 10 || !subs.every((x) => typeof x === 'boolean'))) return res.status(400).json({ error: '세부 할 일 오류' })

    const [cur] = await sql`select status, spent, memo, subs, hidden, name, offset_days, sub_names, extra from tasks where planner_id = ${id} and key = ${key}`
    const next = {
      status: status ?? cur?.status ?? 0,
      spent: spent ?? cur?.spent ?? 0,
      memo: memo ?? cur?.memo ?? '',
      subs: subs ?? cur?.subs ?? [],
      hidden: 'hidden' in b ? b.hidden : cur?.hidden ?? false,
      extra: 'extra' in b ? b.extra : cur?.extra ?? null,
      name: def.custom ? null : 'name' in b ? (b.name ? b.name.trim() : null) : cur?.name ?? null,
      offset_days: def.custom ? null : 'offset_days' in b ? b.offset_days : cur?.offset_days ?? null,
      sub_names: def.custom ? null : 'sub_names' in b ? (b.sub_names ? b.sub_names.map((x) => x.trim()) : null) : cur?.sub_names ?? null,
    }
    const [row] = await sql`
      insert into tasks (planner_id, key, status, spent, memo, subs, hidden, name, offset_days, sub_names, extra, updated_at)
      values (${id}, ${key}, ${next.status}, ${next.spent}, ${next.memo}, ${JSON.stringify(next.subs)}::jsonb, ${next.hidden}, ${next.name}, ${next.offset_days}, ${next.sub_names ? JSON.stringify(next.sub_names) : null}::jsonb, ${next.extra ? JSON.stringify(next.extra) : null}::jsonb, now())
      on conflict (planner_id, key) do update set status = excluded.status, spent = excluded.spent, memo = excluded.memo, subs = excluded.subs, hidden = excluded.hidden, name = excluded.name, offset_days = excluded.offset_days, sub_names = excluded.sub_names, extra = excluded.extra, updated_at = now()
      returning key, status, spent, memo, subs, hidden, name, offset_days, sub_names, extra`
    res.status(200).json({ task: row })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: '잠시 후 다시 시도해 주세요.' })
  }
}
