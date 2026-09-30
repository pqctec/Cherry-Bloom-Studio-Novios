-- Cherry Bloom Studio · Novios — migración 03: servicios de decoración
-- Catálogo de decoración (todo "a cotizar") y solicitudes de cotización de
-- los novios. Ejecuta esto una vez en el SQL Editor, después de la
-- migración 02. Se puede volver a ejecutar sin romper nada.

create table if not exists public.decor_services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  description text,
  image_url text,
  price_label text not null default 'A cotizar', -- cuando tengas precios: 'Desde S/ 350', etc.
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.decor_services enable row level security;
drop policy if exists "decor_services_public_read" on public.decor_services;
create policy "decor_services_public_read" on public.decor_services for select using (active = true);
-- Sin políticas de escritura: lo administras desde el panel de Supabase.

-- Solicitudes de cotización que envían los novios desde su panel.
-- Las revisas en Supabase -> Table Editor -> decor_requests.
create table if not exists public.decor_requests (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  services text[] not null,          -- títulos de los servicios elegidos
  guests_estimate int,
  contact_phone text,
  notes text,
  status text not null default 'nueva' check (status in ('nueva', 'cotizada', 'aceptada', 'descartada')),
  created_at timestamptz not null default now()
);

create index if not exists decor_requests_couple_idx on public.decor_requests(couple_id);

alter table public.decor_requests enable row level security;

drop policy if exists "decor_requests_owner_read" on public.decor_requests;
create policy "decor_requests_owner_read" on public.decor_requests for select using (
  exists (select 1 from public.couples c where c.id = decor_requests.couple_id and c.user_id = auth.uid())
);

drop policy if exists "decor_requests_owner_insert" on public.decor_requests;
create policy "decor_requests_owner_insert" on public.decor_requests for insert with check (
  status = 'nueva'
  and exists (select 1 from public.couples c where c.id = decor_requests.couple_id and c.user_id = auth.uid())
);

insert into public.decor_services (slug, category, title, description, image_url, sort_order)
values
  ('centros-de-mesa', 'Recepción', 'Centros de mesa', 'Arreglos florales, velas en cilindros o candelabros, y opciones sin flores más económicas, en la paleta de colores de su boda.', 'https://images.unsplash.com/photo-1520497386035-8529108d6c6b?auto=format&fit=crop&w=900&q=75', 10),
  ('mesa-de-novios', 'Recepción', 'Mesa de novios y fondo decorado', 'Mantel, caminos de mesa, flores y luces detrás de la mesa principal.', 'https://images.unsplash.com/photo-1561593367-66c79c2294e6?auto=format&fit=crop&w=900&q=75', 20),
  ('mesa-de-dulces', 'Recepción', 'Mesa de dulces (candy bar)', 'Mesa ambientada con postres, bocaditos y golosinas, con los nombres de los novios.', 'https://images.unsplash.com/photo-1719512037593-ff130a27903a?auto=format&fit=crop&w=900&q=75', 30),
  ('iluminacion', 'Recepción', 'Iluminación ambiental', 'Guirnaldas de focos en techo o jardín, luces cálidas en la entrada y velas.', 'https://images.unsplash.com/photo-1608991969807-3833f043d0ca?auto=format&fit=crop&w=900&q=75', 40),
  ('arco-ceremonia', 'Ceremonia', 'Arco o altar floral', 'Arco de madera, hexagonal o redondo, con flores y telas para el momento del “sí”.', 'https://images.unsplash.com/photo-1641834919507-b0271fe5186b?auto=format&fit=crop&w=900&q=75', 50),
  ('pasillo-ceremonia', 'Ceremonia', 'Decoración del pasillo', 'Camino de pétalos, faroles y arreglos en las sillas de la ceremonia.', 'https://images.unsplash.com/photo-1522058171200-e61f77c7353d?auto=format&fit=crop&w=900&q=75', 60),
  ('copas-y-anillos', 'Ceremonia', 'Copas del brindis y cojín de anillos', 'Copas personalizadas con nombres y fecha, y porta aros a juego.', 'https://images.unsplash.com/photo-1758810740432-5c1e7b94eac7?auto=format&fit=crop&w=900&q=75', 70),
  ('panel-de-firmas', 'Recuerdos', 'Panel de firmas', 'Cuadro de huellas, lienzo o árbol para que cada invitado deje su firma y un mensaje.', 'https://images.unsplash.com/photo-1665072200747-5b4680684d45?auto=format&fit=crop&w=900&q=75', 80),
  ('mesa-de-fotos', 'Recuerdos', 'Mesa de fotos y photocall', 'Fondo decorado con marco y props (carteles con frases, bigotes, corazones).', 'https://images.unsplash.com/photo-1758874089358-67fe2adc9bcb?auto=format&fit=crop&w=900&q=75', 90),
  ('recuerdos-personalizados', 'Recuerdos', 'Recuerdos personalizados', 'Tazas, cajitas y detalles estampados con sus nombres para agradecer a cada invitado.', 'https://images.unsplash.com/photo-1521478706270-f2e33c203d95?auto=format&fit=crop&w=900&q=75', 100),
  ('letras-luminosas', 'Detalles', 'Letras gigantes luminosas o neón', '“LOVE”, sus iniciales o sus nombres en letras con focos o letrero de neón.', 'https://images.unsplash.com/photo-1507010430300-19de132ce5ea?auto=format&fit=crop&w=900&q=75', 110),
  ('cartel-bienvenida', 'Detalles', 'Cartel de bienvenida y plano de mesas', 'En acrílico o madera, para recibir a los invitados y que cada uno encuentre su mesa.', 'https://images.unsplash.com/photo-1770150138358-5b8db4066e03?auto=format&fit=crop&w=900&q=75', 120),
  ('caja-de-sobres', 'Detalles', 'Caja para sobres', 'Cofre o buzón decorado para los regalos en efectivo.', 'https://images.unsplash.com/photo-1773005695244-3f6d75654511?auto=format&fit=crop&w=900&q=75', 130),
  ('auto-nupcial', 'Detalles', 'Decoración del auto de los novios', 'Arreglo floral y cintas para la llegada y la salida.', 'https://images.unsplash.com/photo-1561100966-f6aa0145e8e6?auto=format&fit=crop&w=900&q=75', 140),
  ('kit-hora-loca', 'Detalles', 'Kit de hora loca', 'Sombreros, lentes, pulseras luminosas, matracas y más para el momento más divertido de la fiesta.', 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=75', 150)
on conflict (slug) do update set
  category = excluded.category,
  title = excluded.title,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;
