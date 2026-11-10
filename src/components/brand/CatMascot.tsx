export interface CatMascotProps {
  className?: string
  title?: string
}

export function CatMascot({ className, title }: CatMascotProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}

      <path
        d="M30 22c1.2 6.2 3.6 8.6 9.8 9.8-6.2 1.2-8.6 3.6-9.8 9.8-1.2-6.2-3.6-8.6-9.8-9.8 6.2-1.2 8.6-3.6 9.8-9.8Z"
        fill="#F5B82E"
      />
      <path
        d="M168 20c.9 4.6 2.7 6.4 7.3 7.3-4.6.9-6.4 2.7-7.3 7.3-.9-4.6-2.7-6.4-7.3-7.3 4.6-.9 6.4-2.7 7.3-7.3Z"
        fill="#F5B82E"
      />

      <path
        d="M52 82 48 40q-1-7 5-4l33 26Z"
        fill="#F97316"
        stroke="#3D2B1F"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path
        d="M148 82 152 40q1-7-5-4l-33 26Z"
        fill="#F97316"
        stroke="#3D2B1F"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M58 72 55 50l21 13Z" fill="#FFF6E8" />
      <path d="M142 72 145 50l-21 13Z" fill="#FFF6E8" />

      <ellipse
        cx="100"
        cy="110"
        rx="62"
        ry="56"
        fill="#F97316"
        stroke="#3D2B1F"
        strokeWidth="5"
      />

      <path
        d="M89 68v9M100 64v10M111 68v9"
        fill="none"
        stroke="#E5600D"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <ellipse cx="79" cy="103" rx="11" ry="14" fill="#3D2B1F" />
      <ellipse cx="121" cy="103" rx="11" ry="14" fill="#3D2B1F" />
      <circle cx="82.5" cy="98" r="3.5" fill="#FFFFFF" />
      <circle cx="124.5" cy="98" r="3.5" fill="#FFFFFF" />

      <ellipse cx="56" cy="125" rx="12" ry="7" fill="#F7A8A2" />
      <ellipse cx="144" cy="125" rx="12" ry="7" fill="#F7A8A2" />

      <ellipse cx="100" cy="130" rx="26" ry="18" fill="#FFF6E8" />

      <path
        d="M95 117q5-3 10 0 2 2 0 5l-3 4q-2 2-4 0l-3-4q-2-3 0-5Z"
        fill="#EE7F72"
      />
      <path
        d="M100 126v4M100 130q-6 7-12 2M100 130q6 7 12 2"
        fill="none"
        stroke="#3D2B1F"
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      <path
        d="M44 114 20 108M44 124 18 124M44 134 20 140M156 114l24-6M156 124l26 0M156 134l24 6"
        fill="none"
        stroke="#3D2B1F"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}
