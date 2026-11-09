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
        d="M15.5 27.5 12 10.5c-.3-1.5 1.3-2.5 2.6-1.8L29 17.5"
        fill="#F26B21"
        stroke="#F26B21"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M48.5 27.5 52 10.5c.3-1.5-1.3-2.5-2.6-1.8L35 17.5"
        fill="#F26B21"
        stroke="#F26B21"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M17.5 22.5 15.5 14 23 19Z" fill="#FFF8EF" />
      <path d="M46.5 22.5 48.5 14 41 19Z" fill="#FFF8EF" />
      <path
        d="M32 17c10.5 0 19 8.5 19 19S42.5 55 32 55 13 46.5 13 36s8.5-19 19-19Z"
        fill="#F26B21"
      />
      <ellipse cx="32" cy="40.5" rx="12" ry="8.5" fill="#FFF8EF" />
      <path
        d="M22.5 32.5c1.6-2.2 4.4-2.2 6 0"
        fill="none"
        stroke="#3A2A1F"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M35.5 32.5c1.6-2.2 4.4-2.2 6 0"
        fill="none"
        stroke="#3A2A1F"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M30 38.5h4l-2 2.4Z" fill="#3A2A1F" />
      <path
        d="M32 41.2v1.4c-.7 1.3-1.9 1.5-2.9 1.1M32 42.6c.7 1.3 1.9 1.5 2.9 1.1"
        fill="none"
        stroke="#3A2A1F"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18.5 38.5h4.2M18.5 42.2l4.2.9M45.5 38.5h-4.2M45.5 42.2l-4.2.9"
        fill="none"
        stroke="#3A2A1F"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M32 21l1.2 2.8 3 .4-2.2 2.2.6 3-2.6-1.6-2.6 1.6.6-3-2.2-2.2 3-.4Z"
        fill="#F5B82E"
      />
    </svg>
  )
}
