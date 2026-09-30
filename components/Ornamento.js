// Pequeño adorno floral (línea + ramita + corazón) para separar títulos.
export default function Ornamento({ className = 'text-oro' }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`} aria-hidden="true">
      <span className="h-px w-12 bg-current opacity-50" />
      <svg viewBox="0 0 64 20" className="h-5 w-16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M2 10c8 0 12-6 18-6M62 10c-8 0-12-6-18-6" />
        <path d="M10 8c1-3 4-4 6-3-1 2-3 4-6 3ZM54 8c-1-3-4-4-6-3 1 2 3 4 6 3Z" />
        <path d="M32 15s-5-3-5-6.5A2.6 2.6 0 0 1 32 7a2.6 2.6 0 0 1 5 1.5C37 12 32 15 32 15Z" fill="currentColor" fillOpacity=".25" />
      </svg>
      <span className="h-px w-12 bg-current opacity-50" />
    </div>
  )
}
