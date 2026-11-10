export interface CatMarkProps {
  className?: string
  title?: string
}

export function CatMark({ className, title }: CatMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M15 28 12 11c-.3-1.5 1.3-2.5 2.6-1.8L29 18"
        fill="#F97316"
        stroke="#F97316"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M49 28 52 11c.3-1.5-1.3-2.5-2.6-1.8L35 18"
        fill="#F97316"
        stroke="#F97316"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M17 23 15.5 14 23 19Z" fill="#FFF6E8" />
      <path d="M47 23 48.5 14 41 19Z" fill="#FFF6E8" />
      <path
        d="M32 17c10.5 0 19 8.5 19 19S42.5 55 32 55 13 46.5 13 36s8.5-19 19-19Z"
        fill="#F97316"
        stroke="#3D2B1F"
        strokeWidth="2"
      />
      <path
        d="M27 24v5M32 22v6M37 24v5"
        fill="none"
        stroke="#E5600D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M24 31c0-3 2-4 4-4s4 1 4 4v3c0 3-2 4-4 4s-4-1-4-4Z"
        fill="#3D2B1F"
      />
      <path
        d="M32 31c0-3 2-4 4-4s4 1 4 4v3c0 3-2 4-4 4s-4-1-4-4Z"
        fill="#3D2B1F"
      />
      <circle cx="27" cy="30" r="1" fill="#FFFFFF" />
      <circle cx="37" cy="30" r="1" fill="#FFFFFF" />
      <ellipse cx="19" cy="40" rx="5" ry="3" fill="#F7A8A2" />
      <ellipse cx="45" cy="40" rx="5" ry="3" fill="#F7A8A2" />
      <ellipse cx="32" cy="41" rx="10" ry="7" fill="#FFF6E8" />
      <path
        d="M29 37.5q3-2 6 0 1 1 0 2.5l-2 2q-1 1-2 0l-2-2q-1.5-1.5 0-2.5Z"
        fill="#EE7F72"
      />
      <path
        d="M32 42v1.5M32 43.5q-3 3-6 .8M32 43.5q3 3 6 .8"
        fill="none"
        stroke="#3D2B1F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M21 39h-7M21 42l-7 1M43 39h7M43 42l7 1"
        fill="none"
        stroke="#3D2B1F"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M8 16c.4 2.1 1.2 2.9 3.3 3.3-2.1.4-2.9 1.2-3.3 3.3-.4-2.1-1.2-2.9-3.3-3.3 2.1-.4 2.9-1.2 3.3-3.3ZM56 15c.4 2.1 1.2 2.9 3.3 3.3-2.1.4-2.9 1.2-3.3 3.3-.4-2.1-1.2-2.9-3.3-3.3 2.1-.4 2.9-1.2 3.3-3.3Z"
        fill="#F5B82E"
      />
    </svg>
  )
}
