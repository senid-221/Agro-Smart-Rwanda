// Dependency-free PNG downscaler (node:zlib + node:fs only).
// Usage: node tools/resize-png.mjs <input.png> <output.png> <size>
// Handles 8-bit non-interlaced PNGs, color types 0 (gray), 2 (RGB), 6 (RGBA).
// Writes an 8-bit RGB PNG using bilinear resampling.
import { readFileSync, writeFileSync } from 'node:fs'
import { inflateSync, deflateSync } from 'node:zlib'

const [, , inPath, outPath, sizeArg] = process.argv
const SIZE = parseInt(sizeArg || '192', 10)

const buf = readFileSync(inPath)
if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG: ' + inPath)

let off = 8
let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0
const idat = []
while (off < buf.length) {
  const len = buf.readUInt32BE(off)
  const type = buf.toString('ascii', off + 4, off + 8)
  const data = buf.subarray(off + 8, off + 8 + len)
  if (type === 'IHDR') {
    width = data.readUInt32BE(0)
    height = data.readUInt32BE(4)
    bitDepth = data[8]
    colorType = data[9]
    interlace = data[12]
  } else if (type === 'IDAT') {
    idat.push(data)
  } else if (type === 'IEND') {
    break
  }
  off += 12 + len
}
if (bitDepth !== 8) throw new Error('unsupported bit depth ' + bitDepth)
if (interlace !== 0) throw new Error('interlaced PNG not supported')
const srcCh = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : null
if (!srcCh) throw new Error('unsupported color type ' + colorType)

const raw = inflateSync(Buffer.concat(idat))
const stride = width * srcCh
// un-filter scanlines
const px = Buffer.alloc(height * stride)
let p = 0
for (let y = 0; y < height; y++) {
  const filter = raw[p++]
  const lineStart = y * stride
  const prevStart = (y - 1) * stride
  for (let x = 0; x < stride; x++) {
    const cur = raw[p++]
    const a = x >= srcCh ? px[lineStart + x - srcCh] : 0
    const b = y > 0 ? px[prevStart + x] : 0
    const c = (x >= srcCh && y > 0) ? px[prevStart + x - srcCh] : 0
    let v
    switch (filter) {
      case 0: v = cur; break
      case 1: v = cur + a; break
      case 2: v = cur + b; break
      case 3: v = cur + ((a + b) >> 1); break
      case 4: {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c)
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c)
        v = cur + pr; break
      }
      default: throw new Error('bad filter ' + filter)
    }
    px[lineStart + x] = v & 0xff
  }
}

// bilinear resample to SIZE x SIZE, output RGB
const out = Buffer.alloc(SIZE * SIZE * 3)
const sx = width / SIZE, sy = height / SIZE
for (let oy = 0; oy < SIZE; oy++) {
  const fy = Math.min(height - 1, (oy + 0.5) * sy - 0.5)
  const y0 = Math.max(0, Math.floor(fy)), y1 = Math.min(height - 1, y0 + 1)
  const wy = fy - y0
  for (let ox = 0; ox < SIZE; ox++) {
    const fx = Math.min(width - 1, (ox + 0.5) * sx - 0.5)
    const x0 = Math.max(0, Math.floor(fx)), x1 = Math.min(width - 1, x0 + 1)
    const wx = fx - x0
    const o = (oy * SIZE + ox) * 3
    for (let ch = 0; ch < 3; ch++) {
      const s = colorType === 0 ? 1 : srcCh
      const idx = (yy, xx) => (yy * stride) + xx * s + (colorType === 0 ? 0 : ch)
      const c00 = idx(y0, x0), c10 = idx(y0, x1), c01 = idx(y1, x0), c11 = idx(y1, x1)
      const top = px[c00] * (1 - wx) + px[c10] * wx
      const bot = px[c01] * (1 - wx) + px[c11] * wx
      out[o + ch] = Math.round(top * (1 - wy) + bot * wy)
    }
  }
}

// CRC32
let crcTable = null
function crc32(b) {
  if (!crcTable) {
    crcTable = new Int32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      crcTable[n] = c
    }
  }
  let c = 0xffffffff
  for (let i = 0; i < b.length; i++) c = crcTable[(c ^ b[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0)
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td), 0)
  return Buffer.concat([len, td, crc])
}
const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4)
ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0
// filtered scanlines (filter 0)
const enc = Buffer.alloc(SIZE * (SIZE * 3 + 1))
for (let y = 0; y < SIZE; y++) {
  enc[y * (SIZE * 3 + 1)] = 0
  out.copy(enc, y * (SIZE * 3 + 1) + 1, y * SIZE * 3, (y + 1) * SIZE * 3)
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(enc, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
])
writeFileSync(outPath, png)
console.log(outPath + ' ' + SIZE + 'x' + SIZE + ' ' + png.length + ' bytes')
