export interface VideoInfo {
  type: 'youtube' | 'facebook' | 'unknown'
  originalUrl: string
  videoId: string | null
  thumbnail: string | null
  title: string
}

// ── YouTube ────────────────────────────────────────────────
export function parseYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') {
      return u.pathname.slice(1).split('?')[0] || null
    }
    if (u.hostname.includes('youtube.com')) {
      // /watch?v=ID
      const v = u.searchParams.get('v')
      if (v) return v
      // /shorts/ID  /embed/ID  /live/ID  /v/ID
      const m = u.pathname.match(/\/(shorts|embed|live|v)\/([^/?#]+)/)
      if (m) return m[2]
    }
  } catch { /* invalid url */ }
  return null
}

// ── Facebook ───────────────────────────────────────────────
// Returns the numeric/string ID if the URL looks like any Facebook video content.
// Facebook never exposes public thumbnails via a simple CDN URL, so we return null
// for thumbnail and show a branded placeholder instead.
export function parseFacebookVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    // Short link: fb.watch/XXXXX
    if (host === 'fb.watch') {
      const id = u.pathname.slice(1).replace(/\//g, '')
      return id || 'fb-watch'
    }

    if (!host.includes('facebook.com')) return null

    const path = u.pathname

    // /reel/ID  (e.g. /reel/1628700615366369)
    const reelMatch = path.match(/\/reel\/([^/?#]+)/)
    if (reelMatch) return reelMatch[1]

    // /videos/ID  or  /video/ID
    const videoMatch = path.match(/\/videos?\/([^/?#]+)/)
    if (videoMatch) return videoMatch[1]

    // /watch?v=ID  or  ?v=ID
    const v = u.searchParams.get('v')
    if (v) return v

    // /share/r/ID  or  /share/v/ID  or  /share/ID
    const shareMatch = path.match(/\/share(?:\/[rv])?\/([^/?#]+)/)
    if (shareMatch) return shareMatch[1]

    // /story.php?story_fbid=ID
    const storyId = u.searchParams.get('story_fbid')
    if (storyId) return storyId

    // /permalink/ID  or  /posts/ID
    const permalinkMatch = path.match(/\/(?:permalink|posts)\/([^/?#]+)/)
    if (permalinkMatch) return permalinkMatch[1]

    // Generic fallback: last path segment that looks like a long number
    const segments = path.split('/').filter(Boolean)
    const lastNumeric = [...segments].reverse().find(s => /^\d{6,}$/.test(s))
    if (lastNumeric) return lastNumeric

  } catch { /* invalid url */ }
  return null
}

// ── Detect if URL is a Facebook URL at all ─────────────────
export function isFacebookUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    return host.includes('facebook.com') || host === 'fb.watch'
  } catch { return false }
}

// ── Main parser ────────────────────────────────────────────
export function parseVideoUrl(url: string): VideoInfo {
  const trimmed = url.trim()

  const ytId = parseYouTubeId(trimmed)
  if (ytId) {
    return {
      type: 'youtube',
      originalUrl: trimmed,
      videoId: ytId,
      thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      title: 'YouTube Video',
    }
  }

  // Check Facebook — even if we can't get a thumbnail, the URL is valid
  if (isFacebookUrl(trimmed)) {
    const fbId = parseFacebookVideoId(trimmed)
    return {
      type: 'facebook',
      originalUrl: trimmed,
      videoId: fbId,
      // Facebook blocks public thumbnail CDN access — show branded placeholder
      thumbnail: null,
      title: 'Facebook Video',
    }
  }

  return {
    type: 'unknown',
    originalUrl: trimmed,
    videoId: null,
    thumbnail: null,
    title: 'Video',
  }
}
