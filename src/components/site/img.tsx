import Image, { getImageProps, type ImageProps } from "next/image";

// Must match images.remotePatterns in next.config.ts.
const SUPABASE_PUBLIC = /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//;

/** Local files and Supabase Storage go through the optimizer; anything else (e.g. a pasted link in the admin) is served as-is. */
export const optimizable = (src: string) => /^\/(?!\/)/.test(src) || SUPABASE_PUBLIC.test(src);

/** next/image that tolerates image URLs from hosts not allowed in next.config.ts. */
export function Img({ src, alt, unoptimized, ...props }: Omit<ImageProps, "src"> & { src: string }) {
  return <Image src={src} alt={alt} unoptimized={unoptimized || !optimizable(src)} {...props} />;
}

/** srcSet for a <picture><source>, for art-directed images. */
export function responsiveSrcSet(src: string, sizes: string) {
  if (!optimizable(src)) return src;
  return getImageProps({ src, alt: "", fill: true, sizes }).props.srcSet ?? src;
}
