// Operator directory + Rwandan mobile number rules.
// Only the two operators that hold Rwandan mobile ranges are listed; the
// prefix is what tells us where a number currently lives.

const OPERATORS = [
  {
    code: 'MTN',
    name: 'MTN Rwanda',
    short: 'MTN',
    prefixes: ['078', '079'],
    color: '#FFCB05',
    ink: '#141414'
  },
  {
    code: 'AIRTEL',
    name: 'Airtel Rwanda',
    short: 'Airtel',
    prefixes: ['072', '073'],
    color: '#E40000',
    ink: '#FFFFFF'
  }
]

const byCode = code => OPERATORS.find(o => o.code === code) || null

// Accepts 0781234567, 250781234567, +250 78 123 4567, 078 123 4567 …
// Returns the canonical local form (07XXXXXXXX) or null.
function normalizeMsisdn(raw) {
  let n = String(raw == null ? '' : raw).replace(/\D/g, '')
  if (n.startsWith('00250')) n = n.slice(5)
  else if (n.startsWith('250') && n.length === 12) n = n.slice(3)
  if (n.length === 9 && n.startsWith('7')) n = '0' + n
  if (!/^07\d{8}$/.test(n)) return null
  return n
}

function operatorFor(msisdn) {
  const prefix = msisdn.slice(0, 3)
  return OPERATORS.find(o => o.prefixes.includes(prefix)) || null
}

function formatMsisdn(msisdn) {
  return `${msisdn.slice(0, 3)} ${msisdn.slice(3, 6)} ${msisdn.slice(6)}`
}

function maskMsisdn(msisdn) {
  return `${msisdn.slice(0, 3)} *** ${msisdn.slice(6)}`
}

// Human-friendly reference: no 0/O/1/I so it survives being read aloud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newReference() {
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return 'MNP-' + out
}

const REFERENCE_RE = /^MNP-[A-Z2-9]{6}$/

module.exports = {
  OPERATORS,
  byCode,
  normalizeMsisdn,
  operatorFor,
  formatMsisdn,
  maskMsisdn,
  newReference,
  REFERENCE_RE
}
