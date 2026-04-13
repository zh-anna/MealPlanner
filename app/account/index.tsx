import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, type NavigationProp, type ParamListBase } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProfileAvatarImage } from '@/components/profile-avatar-image';
import { ScreenHeader } from '@/components/screen-header';
import { Card } from '@/components/ui/card';
import { MSIcon } from '@/components/ui/ms-icon';
import { UIText } from '@/components/ui/ui-text';
import { accountStickyHeader } from '@/constants/layout';
import { colors } from '@/constants/tokens';
import { ensureSharedUserSession } from '@/lib/auth/shared-sign-in';
import { uploadAvatarFromUri } from '@/lib/db/avatar-upload';
import { fetchProfile, upsertProfile } from '@/lib/db/profile-sync';
import { useMealPlanStore } from '@/stores/use-meal-plan-store';

const INPUT_CLASS =
  'rounded-md border border-border-subtle bg-bg-surface px-md py-sm font-bodyMedium text-[16px] text-text-primary';

const AVATAR_SIZE = 120;
const SAVED_TOAST_MS = 2600;

function rootNavigation(n: NavigationProp<ParamListBase>): NavigationProp<ParamListBase> {
  let current = n;
  let parent = current.getParent() as NavigationProp<ParamListBase> | undefined;
  while (parent) {
    current = parent;
    parent = current.getParent() as NavigationProp<ParamListBase> | undefined;
  }
  return current;
}

export default function AccountScreen() {
  const navigation = useNavigation();
  const nav = useMemo(
    () => rootNavigation(navigation as NavigationProp<ParamListBase>),
    [navigation],
  );
  const generateNextWeek = useMealPlanStore((s) => s.generateNextWeek);
  const refreshWeek = useMealPlanStore((s) => s.refreshWeek);
  const setProfileAvatarUrl = useMealPlanStore((s) => s.setProfileAvatarUrl);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savedVisible, setSavedVisible] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [pendingAvatar, setPendingAvatar] = useState<{ uri: string } | null>(null);
  const [baseline, setBaseline] = useState<{
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { userId: uid } = await ensureSharedUserSession();
      setUserId(uid);
      const p = await fetchProfile(uid);
      const fn = p?.firstName ?? '';
      const ln = p?.lastName ?? '';
      const av = p?.avatarUrl ?? null;
      setFirstName(fn);
      setLastName(ln);
      setAvatarUrl(av);
      setPendingAvatar(null);
      setBaseline({ firstName: fn, lastName: ln, avatarUrl: av });
      setProfileAvatarUrl(av);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [setProfileAvatarUrl]);

  useEffect(() => {
    void load();
  }, [load]);

  const dirty = useMemo(() => {
    if (!baseline) return false;
    if (pendingAvatar) return true;
    return (
      firstName.trim() !== baseline.firstName ||
      lastName.trim() !== baseline.lastName ||
      avatarUrl !== baseline.avatarUrl
    );
  }, [baseline, firstName, lastName, avatarUrl, pendingAvatar]);

  useEffect(() => {
    const sub = nav.addListener('beforeRemove', (e) => {
      if (!dirty) return;
      e.preventDefault();
      Alert.alert('Незбережені зміни', 'Вийти без збереження профілю?', [
        { text: 'Залишитися', style: 'cancel' },
        {
          text: 'Вийти',
          style: 'destructive',
          onPress: () => nav.dispatch(e.data.action),
        },
      ]);
    });
    return sub;
  }, [nav, dirty]);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const showSavedToast = () => {
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    setSavedVisible(true);
    savedTimerRef.current = setTimeout(() => setSavedVisible(false), SAVED_TOAST_MS);
  };

  const saveProfile = async () => {
    if (!userId || !baseline) return;
    setSaving(true);
    try {
      let nextAvatarUrl = avatarUrl;
      if (pendingAvatar) {
        nextAvatarUrl = await uploadAvatarFromUri(userId, pendingAvatar.uri);
        setAvatarUrl(nextAvatarUrl);
        setPendingAvatar(null);
      }
      const { avatarUrl: savedAvatarUrl } = await upsertProfile(userId, {
        firstName,
        lastName,
        avatarUrl: nextAvatarUrl,
      });
      const finalAvatarUrl = savedAvatarUrl ?? nextAvatarUrl;
      setAvatarUrl(finalAvatarUrl);
      setBaseline({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        avatarUrl: finalAvatarUrl,
      });
      setProfileAvatarUrl(finalAvatarUrl);
      showSavedToast();
    } catch (e) {
      Alert.alert('Помилка', e instanceof Error ? e.message : 'Не вдалося зберегти профіль');
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    if (!userId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled || !res.assets[0]) return;

    const asset = res.assets[0];
    setPendingAvatar({ uri: asset.uri });
  };

  const onGenerateNext = async () => {
    setGenerating(true);
    try {
      await generateNextWeek();
      await refreshWeek();
    } finally {
      setGenerating(false);
    }
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const backControl = (
    <Pressable
      onPress={goBack}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel="Назад"
      className="h-11 w-11 items-start justify-start active:opacity-70">
      <MSIcon name="arrow_back" size={28} iconColor={colors.textPrimary} />
    </Pressable>
  );

  const displayName =
    [firstName, lastName].map((s) => s.trim()).filter(Boolean).join(' ') || 'Профіль';

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1">
        <View
          className="bg-bg-canvas"
          style={{
            zIndex: accountStickyHeader.zIndex,
            elevation: accountStickyHeader.elevation,
          }}>
          <ScreenHeader title="Акаунт" subtitle="Профіль і розклад" left={backControl} right={null} />

          {savedVisible ? (
            <View className="border-b border-border-subtle bg-bg-tint px-lg py-sm">
              <UIText variant="bodyMedium" className="text-center text-text-primary">
                Збережено
              </UIText>
            </View>
          ) : null}
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-lg"
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="pb-xxl pt-md"
            style={{ overflow: 'visible' }}
            contentContainerStyle={{ overflow: 'visible' }}>
            <Card className="mb-md">
              <UIText variant="h3" className="mb-md">
                Профіль
              </UIText>
              <UIText variant="bodyBold" className="mb-md text-center">
                {displayName}
              </UIText>

              <View className="mb-md items-center self-center">
                <Pressable
                  onPress={pickAvatar}
                  disabled={saving}
                  className="items-center justify-center active:opacity-90">
                  {pendingAvatar || avatarUrl ? (
                    <ProfileAvatarImage
                      uri={pendingAvatar?.uri ?? avatarUrl}
                      size={AVATAR_SIZE}
                    />
                  ) : (
                    <View
                      className="items-center justify-center border border-border-subtle bg-bg-surfaceHigh"
                      style={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: AVATAR_SIZE / 2,
                      }}>
                      <MSIcon name="person_pin" filled size={48} iconColor={colors.textMuted} />
                    </View>
                  )}
                </Pressable>
                <UIText tone="muted" variant="caption" className="mt-sm text-center">
                 Натисни для вибору фото
                </UIText>
              </View>

              <UIText tone="secondary" variant="label" className="mb-xs">
                Імʼя
              </UIText>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="Імʼя"
                placeholderTextColor={colors.textMuted}
                className={INPUT_CLASS}
              />

              <UIText tone="secondary" variant="label" className="mb-xs mt-md">
                Прізвище
              </UIText>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Прізвище"
                placeholderTextColor={colors.textMuted}
                className={INPUT_CLASS}
              />

              <Pressable
                onPress={() => void saveProfile()}
                disabled={!userId || saving || !dirty}
                className="mt-lg items-center rounded-md bg-brand-lime px-md py-md active:opacity-90 disabled:opacity-50">
                {saving ? (
                  <ActivityIndicator color={colors.butter} />
                ) : (
                  <UIText variant="bodyBold" tone="butter">
                    Зберегти
                  </UIText>
                )}
              </Pressable>
            </Card>

            <Card className="border-border-subtle bg-bg-surfaceHigh">
              <UIText variant="h3" className="mb-xs">
                Розклад
              </UIText>
              <UIText tone="muted" variant="caption" className="mb-md">
                Додай новий тиждень після поточного — дні зʼявляться в горизонтальному списку на вкладці
                «Розклад».
              </UIText>
              <Pressable
                onPress={onGenerateNext}
                disabled={generating || saving}
                className="items-center rounded-md border border-border-subtle bg-bg-butter px-md py-md active:opacity-90 disabled:opacity-50">
                {generating ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <UIText variant="bodyBold" className="text-text-primary">
                    Згенерувати наступний тиждень
                  </UIText>
                )}
              </Pressable>
            </Card>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
