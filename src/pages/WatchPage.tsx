import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

// This page is hit when someone opens a generated video link.
// It stores the slug in sessionStorage so after login the user
// gets redirected to the real video URL.
export default function WatchPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (slug) {
      // Store the slug so the login page can look up the real URL after login
      sessionStorage.setItem('watchSlug', slug)
    }
    // Redirect to the login page immediately
    navigate('/', { replace: true })
  }, [slug, navigate])

  return null
}
