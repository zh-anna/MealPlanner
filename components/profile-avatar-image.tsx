import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Image } from 'expo-image';

import { resolveAvatarDisplayUri } from '@/lib/db/avatar-display-uri';
import { colors } from '@/constants/tokens';

function isLocalUri(u: string) {
  return (
    u.startsWith('file:') ||
    u.startsWith('content:') ||
    u.startsWith('ph://') ||
    u.startsWith('assets-library:')
  );
}

type Props = {
  uri: string | null;
  size: number;
  borderColor?: string;
  onFailure?: () => void;
  onLoad?: () => void;
};

export function ProfileAvatarImage({
  uri,
  size,
  borderColor = colors.borderSubtle,
  onFailure,
  onLoad,
}: Props) {
  const onFailureRef = useRef(onFailure);
  const onLoadRef = useRef(onLoad);
  onFailureRef.current = onFailure;
  onLoadRef.current = onLoad;

  const [remote, setRemote] = useState<{ loading: boolean; displayUri: string | null }>({
    loading: false,
    displayUri: null,
  });
  const r = size / 2;

  useEffect(() => {
    if (!uri?.trim()) {
      setRemote({ loading: false, displayUri: null });
      return;
    }
    const u = uri.trim();
    if (isLocalUri(u)) {
      setRemote({ loading: false, displayUri: u });
      return;
    }
    setRemote({ loading: true, displayUri: null });
    let cancelled = false;
    void resolveAvatarDisplayUri(u)
      .then((resolved) => {
        if (cancelled) return;
        setRemote({ loading: false, displayUri: resolved });
        if (resolved == null) onFailureRef.current?.();
      })
      .catch(() => {
        if (!cancelled) {
          setRemote({ loading: false, displayUri: null });
          onFailureRef.current?.();
        }
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  if (!uri?.trim()) {
    return null;
  }

  const trimmed = uri.trim();
  const local = isLocalUri(trimmed);
  const imageUri = local ? trimmed : remote.displayUri;
  const showSpinner = !local && remote.loading;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: r,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor,
        backgroundColor: colors.surfaceHigh,
      }}>
      {showSpinner ? (
        <View className="items-center justify-center" style={{ width: size, height: size }}>
          <ActivityIndicator color={colors.textMuted} />
        </View>
      ) : imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: size, height: size, borderRadius: r }}
          contentFit="cover"
          cachePolicy="disk"
          recyclingKey={imageUri}
          onError={() => onFailureRef.current?.()}
          onLoad={() => onLoadRef.current?.()}
        />
      ) : null}
    </View>
  );
}
