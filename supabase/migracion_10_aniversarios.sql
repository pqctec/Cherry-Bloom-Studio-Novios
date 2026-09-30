-- Cherry Bloom Studio · Novios — migración 10: bitácora de aniversarios
-- Clientes que confiaron en Cherry Bloom Studio para su boda, para enviarles
-- un recuerdo en cada aniversario. Solo la ve el administrador.
--
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

create table if not exists public.aniversario_clientes (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid unique references public.couples(id) on delete set null, -- si viene de la plataforma
  nombres text not null,                  -- "Karen & Pedro"
  fecha_boda date not null,
  telefono text,
  email text,
  direccion text,                          -- dirección de entrega del recuerdo
  distrito text,
  notas text,                              -- gustos, colores de su boda, qué se decoró…
  activo boolean not null default true,    -- apagar si ya no se desea enviar
  origen text not null default 'manual' check (origen in ('manual', 'decoracion')),
  created_at timestamptz not null default now()
);

create table if not exists public.aniversario_envios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.aniversario_clientes(id) on delete cascade,
  anio int not null,                       -- año del aniversario (ej. 2027)
  aniversario int not null,                -- número de aniversario (1, 2, 3…)
  regalo text,
  notas text,
  enviado_at timestamptz not null default now(),
  unique (cliente_id, anio)
);

alter table public.aniversario_clientes enable row level security;
alter table public.aniversario_envios enable row level security;

drop policy if exists "aniv_clientes_admin" on public.aniversario_clientes;
create policy "aniv_clientes_admin" on public.aniversario_clientes for all
  using (public.es_admin()) with check (public.es_admin());
drop policy if exists "aniv_envios_admin" on public.aniversario_envios;
create policy "aniv_envios_admin" on public.aniversario_envios for all
  using (public.es_admin()) with check (public.es_admin());
revoke all on public.aniversario_clientes, public.aniversario_envios from anon;

-- Alta automática: al marcar una solicitud de decoración como "aceptada",
-- la pareja entra a la bitácora (si tiene fecha de boda y aún no está).
create or replace function public.alta_aniversario_por_decoracion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_c public.couples;
  v_tel text;
  v_email text;
begin
  if new.status = 'aceptada' and (old.status is distinct from 'aceptada') then
    select * into v_c from public.couples where id = new.couple_id;
    if v_c.id is null or v_c.wedding_date is null then
      return new;
    end if;
    select whatsapp into v_tel from public.couple_private where couple_id = v_c.id;
    select email::text into v_email from auth.users where id = v_c.user_id;
    insert into public.aniversario_clientes (couple_id, nombres, fecha_boda, telefono, email, notas, origen)
    values (
      v_c.id,
      v_c.bride_name || ' & ' || v_c.groom_name,
      v_c.wedding_date,
      coalesce(v_tel, new.contact_phone),
      v_email,
      'Decoración: ' || array_to_string(new.services, ', ') || coalesce('. Lugar: ' || v_c.venue, ''),
      'decoracion'
    )
    on conflict (couple_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists decor_requests_alta_aniversario on public.decor_requests;
create trigger decor_requests_alta_aniversario after update on public.decor_requests
  for each row execute function public.alta_aniversario_por_decoracion();

-- Lista con el próximo aniversario de cada cliente, días que faltan, número
-- de aniversario y si ya se envió el recuerdo de ese año.
create or replace function public.admin_aniversarios()
returns table (
  id uuid, couple_id uuid, nombres text, fecha_boda date, telefono text, email text,
  direccion text, distrito text, notas text, activo boolean, origen text,
  proximo date, dias int, aniversario int, enviado_este boolean, ultimo_regalo text, envios bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Acceso solo para administradores';
  end if;
  return query
  with base as (
    select c.*,
      (date_part('year', current_date) - date_part('year', c.fecha_boda))::int as y
    from public.aniversario_clientes c
  ),
  prox as (
    select b.*,
      case
        when b.y < 1 then (b.fecha_boda + interval '1 year')::date
        when (b.fecha_boda + make_interval(years => b.y))::date >= current_date then (b.fecha_boda + make_interval(years => b.y))::date
        else (b.fecha_boda + make_interval(years => b.y + 1))::date
      end as proximo
    from base b
  )
  select p.id, p.couple_id, p.nombres, p.fecha_boda, p.telefono, p.email, p.direccion, p.distrito, p.notas,
         p.activo, p.origen, p.proximo,
         (p.proximo - current_date)::int,
         (date_part('year', p.proximo) - date_part('year', p.fecha_boda))::int,
         exists (select 1 from public.aniversario_envios e where e.cliente_id = p.id and e.anio = date_part('year', p.proximo)::int),
         (select e.regalo from public.aniversario_envios e where e.cliente_id = p.id order by e.anio desc limit 1),
         (select count(*) from public.aniversario_envios e where e.cliente_id = p.id)
  from prox p
  order by p.activo desc, p.proximo;
end;
$$;
revoke execute on function public.admin_aniversarios() from public, anon;
grant execute on function public.admin_aniversarios() to authenticated;
