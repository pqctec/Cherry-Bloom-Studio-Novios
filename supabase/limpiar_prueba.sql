-- Borra la invitación de prueba "Prueba Claude (borrar)" y deshace lo que hizo:
-- su confirmación, el regalo elegido (almohadas), el aporte a la refrigeradora
-- y sus avisos. Ejecútalo una vez en el SQL Editor.
with inv as (
  select id from public.invitations where name = 'Prueba Claude (borrar)'
),
aportes as (
  select gift_item_id, sum(units) as u, sum(amount) as a
  from public.gift_contributions
  where invitation_id in (select id from inv)
  group by gift_item_id
)
update public.gift_items g set
  units_reserved = greatest(0, g.units_reserved - aportes.u),
  collected_amount = greatest(0, g.collected_amount - aportes.a),
  status = 'disponible',
  reserved_by = null,
  reserved_invitation_id = null
from aportes
where g.id = aportes.gift_item_id;

delete from public.gift_contributions where invitation_id in (select id from public.invitations where name = 'Prueba Claude (borrar)');
delete from public.notifications where invitation_id in (select id from public.invitations where name = 'Prueba Claude (borrar)');
delete from public.invitations where name = 'Prueba Claude (borrar)';
