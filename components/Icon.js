// Set de íconos en línea (mismo estilo trazo-fino que usa Cherry Bloom
// Studio Web) para no depender de ninguna librería de íconos externa.
export default function Icon({ name, className = 'h-5 w-5' }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'flower':
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="2.1" />
          <path d="M12 6.9c-1.4-1.6-3.8-1.3-4.1.5-.3 1.5 1 2.6 2.4 2.6M12 6.9c1.4-1.6 3.8-1.3 4.1.5.3 1.5-1 2.6-2.4 2.6M12 11.1c-1.4 1.6-1.1 3.8.5 4.1 1.5.3 2.6-1 2.6-2.4M12 11.1c1.4 1.6 1.1 3.8-.5 4.1-1.5.3-2.6-1-2.6-2.4" />
          <path d="M12 15.4V22" />
        </svg>
      )
    case 'arch':
      return (
        <svg {...common}>
          <path d="M5 21V12a7 7 0 0 1 14 0v9" />
          <path d="M3 21h5M16 21h5" />
        </svg>
      )
    case 'signature':
      return (
        <svg {...common}>
          <path d="M14.2 4.3 19.7 9.8 10.5 19H5v-5.5Z" />
          <path d="M3 20h7" />
        </svg>
      )
    case 'camera':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7l1.4-2.3h5.2L16 7" />
          <circle cx="12" cy="13.5" r="3.2" />
        </svg>
      )
    case 'gift':
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="13" rx="1.5" />
          <path d="M3 12h18M12 8v13" />
          <path d="M12 8c-2 0-3.5-1.2-3.5-3S9.5 2 11 2c1.5 0 1.7 3.2 1 6Zm0 0c2 0 3.5-1.2 3.5-3S13.5 2 12 2c-1.5 0-1.7 3.2-1 6Z" />
        </svg>
      )
    case 'users':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6" />
          <path d="M16 5.5a3 3 0 0 1 0 5.8" />
          <path d="M22 20c0-2.7-2-5-4.8-5.7" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <path d="M4 12.5l5 5L20 6" />
        </svg>
      )
    case 'link':
      return (
        <svg {...common}>
          <path d="M9 15l6-6" />
          <path d="M11 6l1-1a4 4 0 1 1 6 6l-1 1" />
          <path d="M13 18l-1 1a4 4 0 1 1-6-6l1-1" />
        </svg>
      )
    case 'rings':
      return (
        <svg {...common}>
          <circle cx="9" cy="14" r="5.5" />
          <circle cx="15" cy="14" r="5.5" />
          <path d="M10.5 4.5 12 3l1.5 1.5L12 7Z" />
        </svg>
      )
    case 'heart':
      return (
        <svg {...common}>
          <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />
        </svg>
      )
    case 'home':
      return (
        <svg {...common}>
          <path d="M4 11 12 4l8 7" />
          <path d="M6 9.5V20h12V9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      )
    case 'plane':
      return (
        <svg {...common}>
          <path d="M3 13.5 21 6l-4.5 14-4-5.5L7 17l.5-4.8Z" />
          <path d="m12.5 14.5 8.5-8.5" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-4.2-4.2" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      )
    case 'copy':
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
      )
    case 'chat':
      return (
        <svg {...common}>
          <path d="M20 11.5a8 8 0 0 1-11.8 7l-4.2 1.3 1.3-4A8 8 0 1 1 20 11.5Z" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
          <circle cx="12" cy="10" r="2.3" />
        </svg>
      )
    case 'grid':
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
        </svg>
      )
    case 'inbox':
      return (
        <svg {...common}>
          <path d="M3.5 13.5 6 5h12l2.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19Z" />
          <path d="M3.5 13.5H8l1.5 2.5h5l1.5-2.5h4.5" />
        </svg>
      )
    case 'edit':
      return (
        <svg {...common}>
          <path d="M4 20h4L19 9l-4-4L4 16Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      )
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M10 11v6M14 11v6" />
          <path d="M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      )
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3" />
        </svg>
      )
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 4v12M7 11l5 5 5-5" />
          <path d="M4 16v3a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 19v-3" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      )
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 4h6v6M20 4l-9 9" />
          <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      )
    case 'eye-off':
      return (
        <svg {...common}>
          <path d="M3 3l18 18" />
          <path d="M10.6 5.1A9.7 9.7 0 0 1 12 5c5 0 9 5 9 7a9.9 9.9 0 0 1-2.4 3.4M6.3 6.4C4.2 7.8 3 10.3 3 12c0 2 4 7 9 7a9.3 9.3 0 0 0 4.3-1" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      )
    case 'trend':
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M15 7h6v6" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
  }
}
