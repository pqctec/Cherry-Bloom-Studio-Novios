-- Cherry Bloom Studio · Novios — migración 05
-- Los precios del catálogo solo los pueden consultar usuarios con sesión
-- iniciada (novios y admin). Un visitante sin cuenta ve los productos pero no
-- sus precios, ni siquiera consultando la base de datos directamente.
--
-- Ojo: los invitados SÍ ven el precio de los regalos en la página de cada
-- boda, porque ese precio viene de la lista de la pareja (gift_items), no del
-- catálogo.

revoke select (price) on public.gift_catalog from anon;
