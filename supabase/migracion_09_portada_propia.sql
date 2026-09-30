-- Cherry Bloom Studio · Novios — migración 09: foto de portada propia
-- Los novios pueden subir su propia foto de fondo para su página.
-- Ejecuta esto una vez en el SQL Editor. Se puede volver a ejecutar.

alter table public.couples add column if not exists cover_url text;

-- Espacio público "portadas" en Storage. Cada pareja solo puede subir,
-- reemplazar o borrar archivos dentro de su propia carpeta (su id de boda).
insert into storage.buckets (id, name, public)
values ('portadas', 'portadas', true)
on conflict (id) do update set public = true;

drop policy if exists "portadas_owner_insert" on storage.objects;
create policy "portadas_owner_insert" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'portadas'
    and exists (select 1 from public.couples c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid())
  );

drop policy if exists "portadas_owner_update" on storage.objects;
create policy "portadas_owner_update" on storage.objects for update to authenticated
  using (
    bucket_id = 'portadas'
    and exists (select 1 from public.couples c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid())
  );

drop policy if exists "portadas_owner_delete" on storage.objects;
create policy "portadas_owner_delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'portadas'
    and exists (select 1 from public.couples c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid())
  );

drop policy if exists "portadas_owner_read" on storage.objects;
create policy "portadas_owner_read" on storage.objects for select to authenticated
  using (
    bucket_id = 'portadas'
    and exists (select 1 from public.couples c where c.id::text = (storage.foldername(name))[1] and c.user_id = auth.uid())
  );
