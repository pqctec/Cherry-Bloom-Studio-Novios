import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Cherry Bloom Studio · Novios',
  description:
    'Crea gratis la página de tu boda: confirmación de invitados, lista de regalos elegida de nuestro catálogo y decoración de tu evento con Cherry Bloom Studio.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Great+Vibes&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-crema font-sans text-cacao antialiased">
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  )
}
