import Link from 'next/link'

// Página 404 en español (ej. un link de boda mal escrito).
export default function NoEncontrado() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-24 text-center">
      <div className="max-w-md">
        <p className="font-script text-5xl text-rosa-600">Ups…</p>
        <h1 className="titulo mt-3 text-4xl">No encontramos esta página</h1>
        <p className="mt-3 text-sm leading-relaxed text-cacao-700">
          Si buscabas la página de una boda, revisa que el link esté completo o pídeselo de nuevo a los novios.
        </p>
        <Link href="/" className="btn-primario mt-8">
          Ir al inicio
        </Link>
      </div>
    </main>
  )
}
