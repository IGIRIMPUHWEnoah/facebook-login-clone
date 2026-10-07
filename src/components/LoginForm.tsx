import FacebookIcon from './FacebookIcon'

interface LoginFormProps {
  email: string
  password: string
  onEmailChange: (val: string) => void
  onPasswordChange: (val: string) => void
  onSubmit: (e: React.FormEvent) => void
  loading?: boolean
  error?: string
}

export default function LoginForm({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  loading = false,
  error = '',
}: LoginFormProps) {
  return (
    <section className="fb-login" aria-label="Login section">
      {/* Logo shown only on mobile */}
      <div className="fb-login__mobile-logo" aria-hidden="true">
        <FacebookIcon size={72} />
      </div>

      {/* Language selector shown only on mobile */}
      <div className="fb-login__mobile-lang">
        English (US) <span className="fb-login__mobile-lang-arrow">▾</span>
      </div>

      <form className="fb-login__form" onSubmit={onSubmit} noValidate>
        <h1 className="fb-login__title">Log into Facebook</h1>

        <div className="fb-login__fields">
          <input
            type="text"
            className="fb-login__input"
            placeholder="Email or mobile number"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            autoComplete="username"
            aria-label="Email or mobile number"
            disabled={loading}
          />

          <input
            type="password"
            className="fb-login__input"
            placeholder="Password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            autoComplete="current-password"
            aria-label="Password"
            disabled={loading}
          />

          {error && <p className="fb-login__error">{error}</p>}

          <button type="submit" className="fb-login__btn-login" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </button>

          <a href="#" className="fb-login__forgot">
            Forgot password?
          </a>

          <div className="fb-login__gap" />

          <button type="button" className="fb-login__btn-create">
            Create new account
          </button>
        </div>

        {/* Meta branding */}
        <div className="fb-login__meta">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 62 15"
            width="36"
            height="15"
            aria-hidden="true"
          >
            <path
              d="M5.4 7.5C5.4 5.6 6.3 4.4 7.5 4.4c1 0 1.7.6 2.5 1.9C9.1 7.8 8.2 9 7 9c-1 0-1.6-.6-1.6-1.5zm5.5 0c0-1.9.9-3.1 2.1-3.1s2.1 1.2 2.1 3.1-.9 3.1-2.1 3.1-2.1-1.2-2.1-3.1zm4.6 0c.8-1.3 1.5-1.9 2.5-1.9 1.2 0 2.1 1.2 2.1 3.1 0 .9-.6 1.5-1.6 1.5-1.2 0-2.1-1.2-3-2.7zM7.5 2C5.3 2 3.5 3.3 2.5 5.4 1.8 4.2 1 3.5 0 3.5v1.8c.7 0 1.2.8 1.8 1.9v.6C1.8 9.9 3.5 12 5.5 12c1.3 0 2.4-.7 3.5-2.2.7 1.1 1.6 2.2 3 2.2 2 0 3.7-2.1 3.7-4.5S14 3 12 3c-1.4 0-2.3 1.1-3 2.2C8.1 2.9 6.9 2 7.5 2z"
              fill="#0866FF"
            />
          </svg>
          <span>Meta</span>
        </div>
      </form>
    </section>
  )
}
