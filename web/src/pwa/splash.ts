import splashDevices from './splash-devices.json'

type SplashDevice = {
  cssWidth: number
  cssHeight: number
  dpr: number
}

/**
 * Resoluções de referência (CSS px + device pixel ratio) usadas para gerar
 * as splash screens em `public/splash` via `npm run generate:pwa`.
 */
export const SPLASH_DEVICES = splashDevices as SplashDevice[]

export type AppleSplashLink = {
  rel: string
  href: string
  media: string
}

export function appleSplashLinks(): AppleSplashLink[] {
  return SPLASH_DEVICES.flatMap((device) =>
    (['portrait', 'landscape'] as const).map((orientation) => {
      const cssWidth =
        orientation === 'portrait' ? device.cssWidth : device.cssHeight
      const cssHeight =
        orientation === 'portrait' ? device.cssHeight : device.cssWidth

      return {
        rel: 'apple-touch-startup-image',
        href: `/splash/apple-splash-${cssWidth * device.dpr}x${cssHeight * device.dpr}.png`,
        media: `(device-width: ${cssWidth}px) and (device-height: ${cssHeight}px) and (-webkit-device-pixel-ratio: ${device.dpr}) and (orientation: ${orientation})`,
      }
    }),
  )
}
