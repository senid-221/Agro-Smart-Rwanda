// AgroSmart Rwanda — local database layer (tables persisted in localStorage)
AS.db = (function () {
  const KEY = 'as_db_v1'
  let data = null
  try { data = JSON.parse(localStorage.getItem(KEY) || 'null') } catch (e) { data = null }
  if (!data || typeof data !== 'object') data = { tables: {} }

  const save = () => localStorage.setItem(KEY, JSON.stringify(data))
  const table = name => (data.tables[name] = data.tables[name] || [])

  return {
    all(name) { return table(name).slice() },
    find(name, id) { return table(name).find(r => r.id === id) || null },
    insert(name, row) {
      const rec = {
        ...row,
        id: row.id || name.slice(0, 3) + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        at: row.at || Date.now()
      }
      table(name).unshift(rec)
      save()
      return rec
    },
    update(name, id, patch) {
      const rec = table(name).find(r => r.id === id)
      if (!rec) return null
      Object.assign(rec, patch)
      save()
      return rec
    },
    remove(name, id) {
      data.tables[name] = table(name).filter(r => r.id !== id)
      save()
    },
    clear(name) { data.tables[name] = []; save() }
  }
})()
