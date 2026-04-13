-- Аватари: лише власник об'єкта може його читати (через RLS + signed URL).
-- Публічний доступ до /object/public/... вимикається (bucket private).

update storage.buckets
set public = false
where id = 'avatars';

drop policy if exists avatars_select_public on storage.objects;
drop policy if exists avatars_select_own on storage.objects;

-- SELECT лише для файлів у папці = auth.uid() (шлях: "<user_uuid>/avatar.ext")
create policy avatars_select_own
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
