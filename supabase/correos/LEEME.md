# Correos con la marca Cherry Bloom

Pega cada plantilla en Supabase → **Authentication → Emails → Templates**.
En cada una, reemplaza el **Subject** y el cuerpo (**Source**) por el archivo indicado.

| Plantilla en Supabase | Asunto | Archivo |
|---|---|---|
| Confirm sign up | Confirma tu correo · Cherry Bloom Studio Novios | 1_confirmar_registro.html |
| Reset password | Restablece tu contraseña · Cherry Bloom Studio Novios | 2_restablecer_contrasena.html |
| Magic link | Tu enlace para entrar · Cherry Bloom Studio Novios | 3_enlace_de_acceso.html |
| Change email address | Confirma tu nuevo correo · Cherry Bloom Studio Novios | 4_cambio_de_correo.html |
| Invite user | Te invitamos a Cherry Bloom Studio Novios | 5_invitacion.html |

El logo se carga desde `https://cherry-bloom-studio-novios.vercel.app/email-logo.jpg`
(el archivo `public/email-logo.jpg`), así que debe estar publicado con git push.

Para que el remitente diga "Cherry Bloom Studio Novios" en vez de "Supabase Auth"
hace falta un SMTP propio: Authentication → Emails → SMTP Settings.
