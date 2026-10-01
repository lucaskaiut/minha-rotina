import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const publicDir = path.join(
  root,
  process.env.VERCEL ? '.vercel/output/static' : '.output/public',
)

const files = fs
  .readdirSync(distDir)
  .filter((file) => file === 'sw.js' || file.startsWith('workbox-'))

if (!files.includes('sw.js')) {
  throw new Error('dist/sw.js não encontrado — rode o build antes do pwa:sync.')
}

fs.mkdirSync(publicDir, { recursive: true })
for (const file of files) {
  fs.copyFileSync(path.join(distDir, file), path.join(publicDir, file))
}

console.log(`Service worker copiado para ${path.relative(root, publicDir)}.`)
