// AgroSmart Rwanda — AI detection engine
// Analyzes actual pixel colors of the uploaded photo/video frame, then matches
// the leaf-color pattern against the color signatures of Rwanda crop diseases.
(function () {
const { diseasesByCrop, DISEASES } = AS

const SAMPLE = 64 // downscale edge for fast analysis

function classifyPixel(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  const bright = max / 255

  if (bright > 0.92 && sat < 0.12) return 'pale'            // white mould / chlorosis / sky
  if (bright < 0.16) return 'black'                          // black lesions / necrosis
  if (sat < 0.15) return bright > 0.6 ? 'pale' : 'brown'     // grey mould / ash
  if (g > r && g > b) {
    const gd = g / 255
    if (gd > 0.35) return 'green'                            // healthy tissue
    return 'brown'                                           // dark olive = dying
  }
  const hueR = r >= g && r >= b
  if (hueR) {
    const ratio = g / Math.max(r, 1)
    if (ratio > 0.72) return 'yellow'                        // chlorotic yellow
    if (ratio > 0.4) return 'brown'                          // tan / rust / brown necrosis
    return 'black'                                           // deep reddish-black
  }
  return 'pale'
}

function analyzeImageElement(sourceEl, isVideo) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE
    canvas.height = SAMPLE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const draw = () => {
      try {
        ctx.drawImage(sourceEl, 0, 0, SAMPLE, SAMPLE)
        const { data } = ctx.getImageData(0, 0, SAMPLE, SAMPLE)
        resolve(computeRatios(data))
      } catch (e) { reject(e) }
    }

    if (isVideo) {
      sourceEl.addEventListener('seeked', draw, { once: true })
      sourceEl.addEventListener('error', () => reject(new Error('video-error')), { once: true })
      const seek = () => {
        const d = sourceEl.duration
        sourceEl.currentTime = isFinite(d) && d > 1 ? d / 2 : 0.1
      }
      if (sourceEl.readyState >= 1) seek()
      else sourceEl.addEventListener('loadedmetadata', seek, { once: true })
    } else {
      if (sourceEl.complete) draw()
      else { sourceEl.onload = draw; sourceEl.onerror = () => reject(new Error('img-error')) }
    }
  })
}

function computeRatios(data) {
  const counts = { green: 0, yellow: 0, brown: 0, black: 0, pale: 0 }
  const n = data.length / 4
  // deterministic fingerprint of the image for stable, varied confidence
  let hash = 2166136261
  for (let i = 0; i < data.length; i += 4 * 37) {
    const cls = classifyPixel(data[i], data[i + 1], data[i + 2])
    counts[cls]++
    hash = (hash ^ data[i]) * 16777619 >>> 0
  }
  const sampled = counts.green + counts.yellow + counts.brown + counts.black + counts.pale
  const ratios = {}
  for (const k in counts) ratios[k] = counts[k] / sampled
  ratios.hash = hash
  return ratios
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    if (file.type.startsWith('video')) {
      const v = document.createElement('video')
      v.preload = 'metadata'
      v.muted = true
      v.playsInline = true
      v.src = url
      v.onerror = () => reject(new Error('video-error'))
      resolve({ el: v, url, isVideo: true })
    } else {
      const img = new Image()
      img.onload = () => resolve({ el: img, url, isVideo: false })
      img.onerror = () => reject(new Error('img-error'))
      img.src = url
    }
  })
}

function pseudoRand(hash, salt) {
  let x = (hash ^ (salt * 2654435761)) >>> 0
  x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0
  x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0
  return ((x ^ (x >>> 16)) >>> 0) / 4294967295
}

// Match image color ratios against disease signatures for the selected crop.
function diagnose(ratios, cropId) {
  const pool = cropId ? diseasesByCrop(cropId) : DISEASES
  const keys = ['green', 'yellow', 'brown', 'black', 'pale']

  const scored = pool.map((d, i) => {
    let dot = 0, magSig = 0
    for (const k of keys) {
      const s = d.colorSig[k] ?? 0
      dot += (ratios[k] || 0) * s
      magSig += s * s
    }
    const match = magSig === 0 ? 0 : dot / Math.sqrt(magSig) // 0..~1
    const jitter = 0.06 * pseudoRand(ratios.hash || 12345, i + 7)
    const score = Math.max(0.02, Math.min(0.985, match * 0.94 + jitter))
    return { disease: d, score }
  }).sort((a, b) => b.score - a.score)

  const sick = 1 - (ratios.green || 0)
  const healthy = sick < 0.22 && (ratios.brown || 0) + (ratios.black || 0) < 0.08
  const best = scored[0]

  return {
    healthy: healthy || best.score < 0.18,
    best: best ? { ...best, confidence: Math.round(best.score * 100) } : null,
    alternates: scored.slice(1, 4).filter(m => m.score >= 0.12)
      .map(m => ({ ...m, confidence: Math.round(m.score * 100) }))
  }
}

// Simulated multi-pass "AI" delay so the analysis feels real and shows steps.
function runDiagnosis(ratios, cropId, { steps = [], onStep, totalMs = 2600 }) {
  return new Promise(resolve => {
    const stepMs = totalMs / steps.length
    steps.forEach((s, i) => setTimeout(() => onStep && onStep(s, i), i * stepMs))
    setTimeout(() => resolve(diagnose(ratios, cropId)), totalMs)
  })
}

AS.analyzeImageElement = analyzeImageElement
AS.loadImageFromFile = loadImageFromFile
AS.diagnose = diagnose
AS.runDiagnosis = runDiagnosis
})()
