import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ActivityIndicator, Image } from 'react-native';
import type { StyleProp, ImageStyle } from 'react-native';
import { COLORS } from '../theme/colors';

export function AuthenticatedAvatar({ source, style, onFailure }: {
  source: { uri: string; headers: { Authorization: string } };
  style: StyleProp<ImageStyle>;
  onFailure: Dispatch<SetStateAction<boolean>>;
}) {
  const [image, setImage] = useState<{ key: string; uri: string }>();
  const key = source.uri + source.headers.Authorization;

  useEffect(() => {
    const request = new AbortController();
    const reader = new FileReader();
    const timer = setTimeout(() => request.abort(), 20000);
    let active = true;

    async function load() {
      try {
        const response = await fetch(source.uri, {
          headers: { Authorization: source.headers.Authorization, Accept: 'image/*' },
          signal: request.signal,
        });
        if (!response.ok) throw new Error('Avatar request failed');
        const blob = await response.blob();
        if (!active) return;
        reader.onload = () => {
          if (active && typeof reader.result === 'string') setImage({ key, uri: reader.result });
        };
        reader.onerror = () => { if (active) onFailure(true); };
        reader.readAsDataURL(blob);
      } catch {
        if (active) onFailure(true);
      } finally {
        clearTimeout(timer);
      }
    }
    void load();
    return () => {
      active = false;
      clearTimeout(timer);
      request.abort();
      if (reader.readyState === 1) reader.abort();
    };
  }, [source.uri, source.headers.Authorization, key, onFailure]);

  return image?.key === key
    ? <Image source={{ uri: image.uri }} style={style} onError={() => onFailure(true)} />
    : <ActivityIndicator style={style} color={COLORS.white} accessibilityLabel="Đang tải ảnh đại diện" />;
}
