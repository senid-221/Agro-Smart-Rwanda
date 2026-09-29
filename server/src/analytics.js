// Case Intelligence engines for the Crop AI Doctor.
//
// Deterministic, offline-computable analysis over a case's observation timeline.
// These power the Disease Timeline, Crop Recovery Score, Treatment Effectiveness
// and Emergency Crop Alert features. They are intentionally rule-based (not model
// calls) so they are reliable, testable and never hallucinate a number; the AI
// narrates the same facts to the farmer.
const dayKey = d => new Date(d).toISOString().slice(0, 10)
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000)

// Notifiable / quarantine-significant diseases in Rwanda — always escalate to RAB.
const NOTIFIABLE = [
  { id: 'maize-lethal-necrosis', kw: ['lethal necrosis', 'mln', 'urumega'] },
  { id: 'banana-xanthomonas', kw: ['xanthomonas', 'kirabiranya', 'banana wilt'] },
  { id: 'cassava-brown-streak', kw: ['brown streak', 'cbsd', 'cassava brown'] }
]

const SPREAD_KW = [
  'whole field', 'entire field', 'all plants', 'all the plants', 'spreading fast',
  'spreading quickly', 'spreading rapidly', 'rapidly', 'dying', 'severe', 'wiped',
  'ikwirakwira', 'byose', 'gupfa', 'kwihuta', 'ikomeye', 'umurima wose'
]

// Group observations into a day-by-day progression (Disease Timeline).
function timeline(observations) {
  const byDay = new Map()
  ;(observations || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach(o => {
      const k = dayKey(o.created_at)
      if (!byDay.has(k)) byDay.set(k, [])
      byDay.get(k).push({
        kind: o.kind,
        note: o.note || '',
        statusChange: o.status_change || '',
        hasImage: !!(o.images && o.images.length)
      })
    })
  return [...byDay.entries()].map(([date, events]) => ({ date, events }))
}

// Crop Recovery Score (0-100) from the trend of follow-up status changes.
// Returns { score: null } when there is no follow-up data yet.
function recoveryScore(observations) {
  const fu = (observations || []).filter(o => o.kind === 'followup' && o.status_change)
  if (!fu.length) return { score: null, label: 'insufficient', dataPoints: 0 }
  const weights = { improving: 18, stable: 2, worsening: -22 }
  let score = 50
  fu.forEach((o, i) => {
    const recency = (i + 1) / fu.length // later reports weigh more
    score += (weights[o.status_change] || 0) * (0.5 + recency)
  })
  score = Math.max(0, Math.min(100, Math.round(score)))
  const label = score >= 70 ? 'recovering' : score >= 45 ? 'stable' : 'declining'
  return { score, label, dataPoints: fu.length }
}

// Treatment Effectiveness: is the treatment actually working?
// Verdicts: working | not-working | too-early | unclear
function effectiveness(observations) {
  const obs = (observations || []).slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const treatIdx = obs.map(o => o.kind).lastIndexOf('treatment')
  const after = treatIdx === -1
    ? obs.filter(o => o.kind === 'followup' && o.status_change)
    : obs.slice(treatIdx + 1).filter(o => o.kind === 'followup' && o.status_change)

  if (!after.length) {
    return treatIdx === -1
      ? { verdict: 'unclear', evidence: 'No treatment or follow-up recorded yet.' }
      : { verdict: 'too-early', evidence: 'No follow-up recorded since the last treatment.' }
  }

  const last = after[after.length - 1]
  const lastDate = dayKey(last.created_at)
  const sinceTreatment = treatIdx === -1 ? null : daysBetween(obs[treatIdx].created_at, last.created_at)

  if (last.status_change === 'improving') {
    return { verdict: 'working', evidence: `Latest follow-up (${lastDate}) reports the crop is improving.` }
  }
  if (last.status_change === 'worsening') {
    return {
      verdict: 'not-working',
      evidence: `Latest follow-up (${lastDate}) reports worsening. Reassess the diagnosis, application timing/dose/coverage and possible resistance before changing chemicals.`
    }
  }
  // stable
  if (sinceTreatment != null && sinceTreatment < 3) {
    return { verdict: 'too-early', evidence: `Only ${sinceTreatment} day(s) since treatment; symptoms stable. Re-check after the label interval.` }
  }
  return { verdict: 'unclear', evidence: `Symptoms stable at the last follow-up (${lastDate}). Watch for another interval before judging.` }
}

// Emergency Crop Alert: flag serious, rapidly spreading or notifiable problems.
// `diseases` are KB disease objects (from knowledge.detectDiseases) with id/severity.
function emergency({ text, diseases }) {
  const hay = ' ' + String(text || '').toLowerCase() + ' '
  const reasons = []
  const dl = diseases || []

  const notifiable = dl.find(d => NOTIFIABLE.some(n => n.id === d.id)) ||
    NOTIFIABLE.find(n => n.kw.some(k => hay.includes(k)))
  if (notifiable) reasons.push('Notifiable / high-severity disease — report to RAB')

  if (dl.some(d => d.severity === 'high')) reasons.push('High-severity disease suspected')

  if (SPREAD_KW.some(k => hay.includes(k))) reasons.push('Rapid spread or severe crop loss reported')

  return { emergency: reasons.length > 0, reason: reasons.join('; ').slice(0, 200) }
}

module.exports = { timeline, recoveryScore, effectiveness, emergency, NOTIFIABLE, dayKey, daysBetween }
