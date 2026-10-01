import avatarLaura from '#/assets/images/avatar_filha_laura_1790206438870.jpg'
import avatarSophia from '#/assets/images/avatar_filha_sophia_1790206448744.jpg'
import avatarMae from '#/assets/images/avatar_mae_renata_1790206430013.jpg'

export const AVATAR_URLS = {
  laura: avatarLaura,
  sophia: avatarSophia,
  mae: avatarMae,
} as const

const PRESETS = [avatarLaura, avatarSophia, avatarMae]

/** Avatar local quando a filha ainda não tem foto cadastrada na API. */
export function avatarFallback(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i)) % PRESETS.length
  }
  return PRESETS[hash] ?? PRESETS[0]
}
