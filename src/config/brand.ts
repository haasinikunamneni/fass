/**
 * Brand configuration. The name is a placeholder on purpose:
 * set NEXT_PUBLIC_BRAND_NAME in .env.local once the brand is decided.
 */
export const brand = {
  prefix: "MAISON",
  name: process.env.NEXT_PUBLIC_BRAND_NAME || "[BRAND NAME]",
  description:
    "Discover the extraordinary beauty of nature's rarest creations.",
} as const;

export const wordmark = `${brand.prefix} ${brand.name}`;
