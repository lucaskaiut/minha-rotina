import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

/**
 * Gera favicon, ícones do manifest e splash screens do iOS a partir das
 * imagens de marca em src/assets/images (icon.png e logo.png).
 *
 * Uso: npm run generate:pwa
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const imagesDir = path.join(root, 'src/assets/images')
const publicDir = path.join(root, 'public')
const splashDir = path.join(publicDir, 'splash')

const iconPath = path.join(imagesDir, 'icon.png')
const logoPath = path.join(imagesDir, 'logo.png')
const devices = JSON.parse(
  fs.readFileSync(path.join(root, 'src/pwa/splash-devices.json'), 'utf8'),
)

const BACKGROUND = { r: 248, g: 250, b: 252, alpha: 1 } // #F8FAFC
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 }
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 }

async function squareIcon(size, { pad = 0, background = TRANSPARENT } = {}) {
  const inner = Math.max(1, Math.round(size * (1 - pad)))
  const icon = await sharp(iconPath)
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT })
    .png()
    .toBuffer()

  return sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toBuffer()
}

async function splash(width, height) {
  const logoWidth = Math.round(Math.min(width, height) * 0.42)
  const logo = await sharp(logoPath)
    .resize({ width: logoWidth, fit: 'inside' })
    .png()
    .toBuffer()

  return sharp({
    create: { width, height, channels: 4, background: BACKGROUND },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: true })
    .toBuffer()
}

fs.mkdirSync(splashDir, { recursive: true })

fs.writeFileSync(path.join(publicDir, 'icon.png'), await squareIcon(512))
fs.writeFileSync(path.join(publicDir, 'pwa-64x64.png'), await squareIcon(64))
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), await squareIcon(192))
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), await squareIcon(512))
fs.writeFileSync(
  path.join(publicDir, 'maskable-icon-512x512.png'),
  await squareIcon(512, { pad: 0.25, background: WHITE }),
)
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon-152x152.png'),
  await squareIcon(152, { background: WHITE }),
)
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon-167x167.png'),
  await squareIcon(167, { background: WHITE }),
)
fs.writeFileSync(
  path.join(publicDir, 'apple-touch-icon-180x180.png'),
  await squareIcon(180, { background: WHITE }),
)

const faviconSources = []
for (const size of [16, 32, 48]) {
  faviconSources.push(await squareIcon(size))
}
fs.writeFileSync(
  path.join(publicDir, 'favicon.ico'),
  await pngToIco(faviconSources),
)

let splashCount = 0
for (const { cssWidth, cssHeight, dpr } of devices) {
  for (const orientation of ['portrait', 'landscape']) {
    const width = (orientation === 'portrait' ? cssWidth : cssHeight) * dpr
    const height = (orientation === 'portrait' ? cssHeight : cssWidth) * dpr
    const file = path.join(splashDir, `apple-splash-${width}x${height}.png`)
    fs.writeFileSync(file, await splash(width, height))
    splashCount += 1
  }
}

console.log(
  `PWA assets gerados: favicon, 7 ícones, ${splashCount} splash screens do iOS.`,
)
