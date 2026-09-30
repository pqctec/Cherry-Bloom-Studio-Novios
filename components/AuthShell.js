import { FOTOS } from '@/lib/escenarios'

// Marco común para registro e inicio de sesión: foto romántica a un lado
// (solo en pantallas grandes) y el formulario al otro.
export default function AuthShell({ foto = FOTOS.anillo, frase, children }) {
  return (
    <main className="grid min-h-[calc(100vh-73px)] lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <img src={foto} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-cacao/80 via-cacao/10 to-transparent" />
        {frase && (
          <p className="absolute inset-x-0 bottom-0 p-12 font-serif text-3xl italic leading-snug text-white">{frase}</p>
        )}
      </div>
      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </main>
  )
}
