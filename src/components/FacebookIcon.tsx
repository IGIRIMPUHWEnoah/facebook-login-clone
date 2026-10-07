interface FacebookIconProps {
  size?: number
  className?: string
}

export default function FacebookIcon({ size = 40, className = '' }: FacebookIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      aria-label="Facebook"
      role="img"
    >
      <circle cx="24" cy="24" r="24" fill="#1877F2" />
      <path
        d="M33 24h-6v14h-6V24h-4v-5h4v-3c0-4 2-6 6-6h4v5h-3c-1 0-1 .5-1 1v3h4l-1 5z"
        fill="white"
      />
    </svg>
  )
}
