import { readAsStringAsync } from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';
import { supabase } from '@/lib/supabase';

const AVATAR_MAX_EDGE = 512;

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

async function optimizeAvatarLocalUri(localUri: string): Promise<string> {
  try {
    let actions: ImageManipulator.Action[] = [];
    try {
      const { width: w, height: h } = await getImageSize(localUri);
      if (Math.max(w, h) > AVATAR_MAX_EDGE) {
        if (w >= h) {
          actions.push({ resize: { width: AVATAR_MAX_EDGE } });
        } else {
          actions.push({ resize: { height: AVATAR_MAX_EDGE } });
        }
      }
    } catch {
      actions.push({ resize: { width: AVATAR_MAX_EDGE } });
    }

    const { uri } = await ImageManipulator.manipulateAsync(localUri, actions, {
      compress: 0.82,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return uri;
  } catch {
    return localUri;
  }
}

async function readLocalImageArrayBuffer(localUri: string): Promise<ArrayBuffer> {
  try {
    const base64 = await readAsStringAsync(localUri, { encoding: 'base64' });
    const buf = base64ToArrayBuffer(base64);
    if (!buf.byteLength) {
      throw new Error('Порожній файл зображення');
    }
    return buf;
  } catch {
    const res = await fetch(localUri);
    if (!res.ok) {
      throw new Error(`Не вдалося прочитати фото (${res.status})`);
    }
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) {
      throw new Error('Порожній файл зображення');
    }
    return buf;
  }
}

export async function uploadAvatarFromUri(userId: string, localUri: string): Promise<string> {
  const optimizedUri = await optimizeAvatarLocalUri(localUri);
  const path = `${userId}/avatar.jpg`;
  const contentType = 'image/jpeg';

  const body = await readLocalImageArrayBuffer(optimizedUri);

  const { data: uploaded, error: upErr } = await supabase.storage.from('avatars').upload(path, body, {
    contentType,
    upsert: true,
  });
  if (upErr) throw upErr;
  if (!uploaded?.path) {
    throw new Error('Supabase Storage: upload не повернув path');
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  if (!data?.publicUrl?.trim()) {
    throw new Error('Supabase Storage: getPublicUrl не повернув URL');
  }
  return data.publicUrl;
}
