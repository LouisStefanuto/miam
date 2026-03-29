import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE } from '@/lib/config';
import { handleCfRedirect } from '@/lib/api';

function fetchAuthImage(imageUrl: string): Promise<string> {
  return fetch(imageUrl, {
    credentials: 'same-origin',
    redirect: 'manual',
  })
    .then((res) => {
      if (handleCfRedirect(res)) throw new Error('Session expired (Cloudflare Access)');
      if (!res.ok) throw new Error(`Image fetch failed: ${res.status}`);
      return res.blob();
    })
    .then((blob) => URL.createObjectURL(blob));
}

/**
 * Fetches an image from the secure /images endpoint with auth headers
 * and returns a blob URL that can be used in <img src>.
 * Results are cached via React Query — same URL won't be re-fetched on remount.
 */
export function useAuthImage(imageUrl: string | undefined): string | undefined {
  const isApiImage = imageUrl?.startsWith(`${API_BASE}/images/`);

  const { data } = useQuery({
    queryKey: ['auth-image', imageUrl],
    queryFn: () => fetchAuthImage(imageUrl!),
    enabled: !!imageUrl && isApiImage,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  });

  // Non-API URLs (data URLs, external URLs) pass through directly
  if (imageUrl && !isApiImage) return imageUrl;

  return data;
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
