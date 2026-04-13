import { supabase } from '@/lib/supabase';

const AVATARS_IN_STORAGE_URL =
  /\/storage\/v1\/(?:object|render\/image)\/(?:public|sign)\/avatars\/([^?#]+)/i;

function storageObjectPathFromUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) {
    return t.replace(/^\/+/, '');
  }
  const m = t.match(AVATARS_IN_STORAGE_URL);
  if (!m?.[1]) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

export async function resolveAvatarDisplayUri(avatarUrlFromDb: string | null): Promise<string | null> {
  if (!avatarUrlFromDb?.trim()) return null;
  const fallback = avatarUrlFromDb.trim();
  try {
    const path = storageObjectPathFromUrl(avatarUrlFromDb);
    if (!path) return fallback;

    const { data, error } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 12);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
