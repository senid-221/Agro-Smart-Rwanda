// Loads the browser data files (which assign onto a global `AS`) into a plain
// object using a VM sandbox, so the server can seed PostgreSQL from the same source
// of truth the frontend ships with. No frontend code is duplicated here.
const fs = require('fs')
const path = require('path')
const vm = require('vm')
const config = require('./config')

function loadStaticData() {
  const dataDir = path.join(config.staticDir, 'js', 'data')
  const files = ['products.js']
  const sandbox = { window: {}, AS: {} }
  sandbox.window.AS = sandbox.AS
  sandbox.globalThis = sandbox
  vm.createContext(sandbox)
  for (const f of files) {
    const full = path.join(dataDir, f)
    if (!fs.existsSync(full)) continue
    vm.runInContext(fs.readFileSync(full, 'utf8'), sandbox, { filename: f })
  }
  return {
    products: sandbox.AS.PRODUCTS || [],
    categories: sandbox.AS.PRODUCT_CATEGORIES || []
  }
}

module.exports = { loadStaticData }
