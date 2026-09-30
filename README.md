# Cherry Bloom Studio · Novios (Fase 1)

Producto nuevo y separado de Cherry Bloom Studio Web: lista de invitados, lista
de regalos (productos físicos con margen + fondos de dinero) y página pública
por cada boda. Registro abierto — cualquier pareja puede crear su cuenta sola.

Esta es la Fase 1: sin cobros reales todavía. La Fase 2 conecta Culqi para el
checkout de tarjeta y el split automático de comisión.

## 1. Crea un proyecto de Supabase nuevo

No uses el mismo proyecto de Supabase de Cherry Bloom Studio Web — este
producto tiene registro abierto al público, así que conviene mantenerlo en una
base de datos separada.

1. Ve a https://supabase.com/dashboard y crea un proyecto nuevo.
2. En el SQL Editor, ejecuta en este orden (cada archivo completo):
   1. `supabase/schema.sql`
   2. `supabase/fix_registro.sql` (si ya ejecutaste la versión nueva de schema.sql, ya está incluido)
   3. `supabase/migracion_02_catalogo.sql` — crea el catálogo de regalos y carga 31 productos
   4. `supabase/migracion_03_decoracion.sql` — crea los 15 servicios de decoración (a cotizar) y las solicitudes de cotización
   5. `supabase/migracion_04_admin.sql` — activa el panel de administración `/admin` para pqctec@gmail.com
   6. `supabase/migracion_05_precios_privados.sql` — los precios del catálogo solo se ven con sesión iniciada
   7. `supabase/migracion_06_invitaciones.sql` — invitaciones personales con pases y regalos desde el link del invitado
   8. `supabase/migracion_07_decoracion_y_regalos.sql` — paso de decoración (sí/no), regalos con cantidad y regalos compartidos
   9. `supabase/migracion_08_avisos_y_plazos.sql` — fecha límite para confirmar, novedades, recordatorios y agradecimientos
   10. `supabase/migracion_09_portada_propia.sql` — foto de portada propia de los novios
   11. `supabase/migracion_10_aniversarios.sql` — bitácora de aniversarios de tus clientes
   12. `supabase/migracion_11_usuarios.sql` — usuarios y accesos desde /admin
3. En **Authentication → Providers**, confirma que "Email" esté habilitado.
   Si quieres saltarte la confirmación por correo mientras pruebas, en
   **Authentication → Settings** puedes desactivar "Confirm email"
   temporalmente (recomendado volver a activarlo antes de lanzar en público).
4. En **Project Settings → API**, copia el "Project URL" y el "anon public key".

## 2. Configura el proyecto

```bash
npm install
cp .env.local.example .env.local
```

Edita `.env.local` con la URL y la anon key que copiaste, y con la URL donde
vas a desplegar (te la da Vercel al desplegar, o usa `http://localhost:3000`
mientras pruebas en tu máquina).

Copia también `custom-logo.jpg` desde tu proyecto Cherry-Bloom-Studio-Web
(carpeta `public/`) a la carpeta `public/` de este proyecto, para que el logo
se vea en el encabezado.

```bash
npm run dev
```

Abre http://localhost:3000 — deberías ver la landing. Prueba registrarte en
`/registro`, agrega invitados y regalos desde `/panel`, y revisa cómo se ve tu
página pública en `/boda/tu-slug`.

## 3. Súbelo a GitHub y despliega en Vercel

Igual que hiciste con Cherry Bloom Studio Web:

```bash
git init
git add .
git commit -m "Version inicial: Cherry Bloom Studio Novios (Fase 1)"
```

Crea un repositorio nuevo en GitHub (por ejemplo `Cherry-Bloom-Studio-Novios`)
y conéctalo:

```bash
git remote add origin https://github.com/pqctec/Cherry-Bloom-Studio-Novios.git
git branch -M main
git push -u origin main
```

Luego impórtalo en Vercel como un proyecto nuevo, y en sus "Environment
Variables" pega las mismas variables de tu `.env.local` (incluyendo
`NEXT_PUBLIC_SITE_URL` con el dominio final que Vercel te asigne, o el que tú
conectes).

## 4. Conecta el link desde Cherry Bloom Studio Web

Ya dejé listo un enlace desde la sección de Servicios de Cherry Bloom Studio
Web (tema Personalizados) hacia este sitio. Apunta por defecto a
`https://novios.cherrybloomstudio.com` — si tu URL real es otra (la que te dé
Vercel, o el dominio que conectes), agrega esta variable de entorno en el
proyecto de Cherry Bloom Studio Web en Vercel:

```
NEXT_PUBLIC_NOVIOS_URL=https://tu-url-real.vercel.app
```

## Panel de administración (/admin)

Entra a `/admin` (o inicia sesión en `/login` con tu correo de administrador)
para gestionar todo sin tocar Supabase:

- **Resumen:** parejas, solicitudes nuevas, regalos elegidos, margen estimado,
  próximas bodas y regalos más elegidos.
- **Catálogo de regalos:** crear, editar, ocultar o eliminar productos; subir
  fotos (se optimizan solas); ver precio de venta y margen al instante;
  importar y exportar CSV.
- **Decoración:** crear y editar servicios, fotos y "A cotizar" o "Desde S/ …".
- **Solicitudes:** ver lo que piden los novios, cambiar el estado, escribirles
  por WhatsApp o correo y guardar notas internas.
- **Parejas:** todas las parejas registradas con sus números; exportable.

Para dar acceso a otra persona: en SQL Editor,
`insert into public.admins (email) values ('su@correo.com');`

## Catálogo de regalos (carga masiva)

Los novios ya no inventan productos ni precios: eligen del catálogo que tú
administras (tabla `gift_catalog`). El precio de venta se calcula solo en la
base de datos: **precio de referencia + 10 %, redondeado hacia arriba al sol
entero**. El precio de referencia, la tienda, el link y las notas son
privados — la web pública solo ve el precio de venta.

Para agregar productos o actualizar precios en bloque:

1. Abre `supabase/catalogo_regalos.csv` (en Excel, Google Sheets o VS Code) y
   edita o agrega filas. `sku` es tu código único: si repites un sku, esa fila
   actualiza el producto existente. Para ocultar un producto pon `active` en
   `false`. **No agregues columna de precio de venta.**
2. En VS Code: `Terminal → Ejecutar tarea… → Catálogo: generar SQL desde el CSV`
   (o `npm run catalogo`). Se crea `supabase/catalogo_carga.sql`.
3. Copia ese archivo completo y ejecútalo en Supabase → SQL Editor.

También puedes editar un producto suelto desde Supabase → Table Editor →
`gift_catalog`.

Las fotos de los productos apuntan a las imágenes de la tienda de referencia.
Antes de lanzar al público conviene subirlas a tu propio Storage de Supabase
(o usar fotos del proveedor), porque la tienda puede cambiarlas o borrarlas.

## Decoración (a cotizar)

Los servicios de decoración están en la tabla `decor_services`. Para poner un
precio referencial, cambia `price_label` (por ejemplo `Desde S/ 350`) en
Supabase → Table Editor. Las solicitudes que envían los novios desde su panel
llegan a `decor_requests`; ahí puedes cambiar `status` a `cotizada`,
`aceptada` o `descartada` y los novios lo verán en su panel. El número de
WhatsApp para cotizar está en `lib/escenarios.js` (`WHATSAPP_NOVIOS`).

## Usuarios y accesos

En **/admin/usuarios** ves todas las cuentas registradas y puedes:

- **Confirmar el correo a mano** si a alguien no le llegó el correo de confirmación.
- **Suspender / reactivar** el acceso: no puede iniciar sesión, pero su página de boda y sus datos se conservan.
- **Eliminar** una cuenta: borra la cuenta y todo lo de su boda (la bitácora de aniversarios se conserva).
- **Agregar o quitar administradores** por correo. No puedes quitarte a ti mismo ni dejar el panel sin administradores.

## Aniversarios (recuerdos para tus clientes)

En **/admin/aniversarios** llevas la bitácora de las parejas que confiaron en Cherry Bloom Studio.

- **Se llena sola:** cuando marcas una solicitud de decoración como *Aceptada*, la pareja entra con su fecha de boda, WhatsApp, correo y lo que se decoró. También puedes agregar clientes a mano (bodas antiguas o fuera de la plataforma).
- **Recordatorio 15 días antes:** el menú muestra un contador en *Aniversarios* y la página lista "Toca preparar estos recuerdos". Además, el botón **Calendario** descarga un evento anual con alarmas 15 días y 1 día antes (ábrelo en tu celular y se guarda en Google Calendar / iPhone).
- **Historial:** al marcar un recuerdo como enviado queda registrado qué se regaló cada año, para no repetir.

## Avisos automáticos por WhatsApp (opcional)

Cada confirmación y cada regalo aparece siempre en el panel de los novios
("Novedades"). Para que además les llegue un **WhatsApp automático**, WhatsApp
exige usar su API oficial (WhatsApp Cloud API de Meta):

1. Crea una app en https://developers.facebook.com (tipo "Business") y agrega
   el producto **WhatsApp**. Registra el número que enviará los avisos (debe
   ser un número que no esté usando la app normal de WhatsApp).
2. En **WhatsApp Manager → Plantillas**, crea una plantilla de categoría
   "Utilidad", idioma Español, llamada `aviso_boda`, con este texto:
   `Hola {{1}}, tienes una novedad en tu boda: {{2}}. Revisa tu panel de Cherry Bloom Studio Novios.`
   Espera a que Meta la apruebe.
3. Genera un **token permanente** (usuario del sistema) con permiso
   `whatsapp_business_messaging` y copia el **Phone number ID**.
4. Agrega en `.env.local` y en Vercel → Environment Variables:
   `SUPABASE_SERVICE_ROLE_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`
   (y opcionalmente `WHATSAPP_TEMPLATE`, `WHATSAPP_TEMPLATE_LANG`).
5. Los novios escriben su número en "Nuestra página → Avisos por WhatsApp".

Meta cobra una tarifa pequeña por cada mensaje de plantilla de utilidad
(revisa los precios vigentes para Perú en la página de precios de WhatsApp
Business Platform antes de activarlo).
Mientras no configures esto, todo funciona igual y los avisos quedan en el panel.

## Qué falta (Fase 2 y 3)

- **Fase 2 (Culqi):** checkout real de tarjeta para productos físicos y para
  los fondos de dinero, con split automático (95% a los novios / 5% a Cherry
  Bloom Studio, usando Culqi Split o Culqi Connect), webhooks de confirmación,
  y notificación en tiempo real a los novios cuando alguien regala.
- **Fase 3:** panel interno tuyo para ver todas las bodas activas, comisiones
  acumuladas y pedidos físicos por despachar; recordatorios automáticos a
  invitados que no han confirmado; páginas legales (términos, políticas de
  reembolso) obligatorias en cuanto haya cobro con tarjeta de por medio.
