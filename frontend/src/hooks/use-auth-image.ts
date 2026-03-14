import React, { useEffect, useState } from 'react';
import { API_BASE } from '@/lib/config';

/**
 * Fetches an image from the secure /images endpoint with auth headers
 * and returns a blob URL that can be used in <img src>.
 */
export function useAuthImage(imageUrl: string | undefined): string | undefined {
  const [blobUrl, setBlobUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl(undefined);
      return;
    }

    // Only intercept API image URLs — pass through data URLs and external URLs
    if (!imageUrl.startsWith(`${API_BASE}/images/`)) {
      setBlobUrl(imageUrl);
      return;
    }

    let revoked = false;
    let currentUrl: string | undefined;

    const token = localStorage.getItem('miam-auth-token');
    fetch(imageUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (revoked) return;
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      })
      .catch(() => {
        if (!revoked) setBlobUrl(undefined);
      });

    return () => {
      revoked = true;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [imageUrl]);

  return blobUrl;
}

/**
 * Drop-in replacement for <img> that fetches from the secure /images endpoint.
 * Renders nothing while loading, then a normal <img> with the blob URL.
 */
export function AuthImage({ src, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  const blobUrl = useAuthImage(src);
  if (!blobUrl) return null;
  return React.createElement('img', { ...props, src: blobUrl });
}
