import { supabase } from '@/lib/supabase';

export type Profile = {
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
};

function rowToProfile(row: {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}): Profile {
  return {
    userId: row.user_id,
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    avatarUrl: row.avatar_url,
  };
}

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToProfile(data as Parameters<typeof rowToProfile>[0]);
}

export async function upsertProfile(
  userId: string,
  payload: { firstName: string; lastName: string; avatarUrl: string | null },
): Promise<{ avatarUrl: string | null }> {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(
      {
        user_id: userId,
        first_name: payload.firstName.trim(),
        last_name: payload.lastName.trim(),
        avatar_url: payload.avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('avatar_url')
    .single();

  if (error) throw error;
  return { avatarUrl: data?.avatar_url ?? null };
}
