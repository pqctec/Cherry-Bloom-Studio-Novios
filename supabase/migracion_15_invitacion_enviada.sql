-- Cherry Bloom Studio · Novios — migración 15: marcar invitaciones enviadas
-- Guarda cuándo se abrió WhatsApp para enviar cada invitación, para saber
-- cuáles faltan enviar y poder enviarlas una tras otra.
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

alter table public.invitations add column if not exists sent_at timestamptz;
