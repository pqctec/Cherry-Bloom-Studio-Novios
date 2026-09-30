export const metadata = { title: 'Política de privacidad · Cherry Bloom Studio Novios' }

// Texto base. Recomendación: que lo revise un abogado antes de lanzar.
export default function PrivacidadPage() {
  const actualizado = '29 de septiembre de 2026'
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <span className="eyebrow">Legal</span>
      <h1 className="titulo mt-3 text-4xl sm:text-5xl">Política de privacidad</h1>
      <p className="mt-2 text-sm text-cacao-500">Última actualización: {actualizado}</p>

      <div className="mt-10 space-y-8 text-sm leading-relaxed text-cacao-700 [&_h2]:mb-2 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-cacao [&_li]:ml-5 [&_li]:list-disc">
        <section>
          <h2>1. Quiénes somos</h2>
          <p>
            Cherry Bloom Studio Novios (en adelante, “la plataforma”) es un servicio de Cherry Bloom Studio, con domicilio en
            Lima, Perú, que permite a las parejas crear la página de su boda, gestionar sus invitaciones, su lista de regalos y
            solicitar servicios de decoración. Para cualquier consulta sobre tus datos escríbenos a{' '}
            <a href="mailto:pqctec@gmail.com" className="text-terracota underline">pqctec@gmail.com</a>.
          </p>
        </section>

        <section>
          <h2>2. Qué datos recogemos</h2>
          <ul className="space-y-1">
            <li><b>De las parejas:</b> nombres, correo electrónico, contraseña (guardada cifrada), fecha y lugar de la boda, WhatsApp de contacto y las preferencias que registren (regalos, decoración).</li>
            <li><b>De los invitados:</b> el nombre y, si los novios lo registran, el teléfono de cada invitación; la respuesta de asistencia, el número de asistentes, los nombres y mensajes que el invitado escriba y los regalos o aportes que elija.</li>
            <li><b>Datos técnicos:</b> los mínimos necesarios para mantener la sesión iniciada y la seguridad del servicio.</li>
          </ul>
        </section>

        <section>
          <h2>3. Para qué los usamos</h2>
          <ul className="space-y-1">
            <li>Mostrar la página de la boda y permitir que los invitados confirmen su asistencia y elijan su regalo.</li>
            <li>Que los novios vean las confirmaciones, regalos y avisos en su panel.</li>
            <li>Comprar y entregar los regalos elegidos y preparar las cotizaciones de decoración solicitadas.</li>
            <li>Comunicarnos con los novios sobre su boda y los servicios contratados.</li>
          </ul>
          <p className="mt-2">No vendemos ni alquilamos datos personales, ni los usamos para publicidad de terceros.</p>
        </section>

        <section>
          <h2>4. Quién puede verlos</h2>
          <p>
            Los datos de cada invitación solo los ven los novios de esa boda y el equipo de Cherry Bloom Studio. La página
            pública de la boda muestra únicamente los nombres de los novios, la fecha, el lugar, su mensaje y la lista de
            regalos. Los datos se almacenan con nuestro proveedor de infraestructura (Supabase), que puede alojarlos fuera del
            Perú con medidas de seguridad adecuadas.
          </p>
        </section>

        <section>
          <h2>5. Cuánto tiempo los guardamos</h2>
          <p>
            Mientras la cuenta de la pareja esté activa y hasta 12 meses después de la fecha de la boda, salvo que la pareja
            pida eliminarla antes o que la ley exija conservarlos por más tiempo.
          </p>
        </section>

        <section>
          <h2>6. Tus derechos</h2>
          <p>
            De acuerdo con la Ley N.º 29733, Ley de Protección de Datos Personales, y su reglamento, puedes solicitar el
            acceso, rectificación, cancelación u oposición al tratamiento de tus datos escribiendo a{' '}
            <a href="mailto:pqctec@gmail.com" className="text-terracota underline">pqctec@gmail.com</a>. Si consideras que no
            atendimos tu solicitud, puedes acudir a la Autoridad Nacional de Protección de Datos Personales.
          </p>
        </section>

        <section>
          <h2>7. Cambios</h2>
          <p>Si actualizamos esta política, publicaremos la nueva versión en esta misma página con su fecha.</p>
        </section>
      </div>
    </main>
  )
}
