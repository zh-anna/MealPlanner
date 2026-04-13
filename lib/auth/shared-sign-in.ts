import { supabase } from '@/lib/supabase';

export async function ensureSharedUserSession(): Promise<{ userId: string }> {
  const email = process.env.EXPO_PUBLIC_SYNC_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_SYNC_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Заповни EXPO_PUBLIC_SYNC_EMAIL та EXPO_PUBLIC_SYNC_PASSWORD у .env (спільний користувач Supabase).',
    );
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user?.id) {
    return { userId: sessionData.session.user.id };
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.user?.id) throw new Error('Після входу user id відсутній');
  return { userId: data.user.id };
}
