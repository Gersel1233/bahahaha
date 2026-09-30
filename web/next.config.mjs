/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The page is a lot of large media. Vercel's image pipeline handles the
  // photographs; the films are served as they are.
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};
export default nextConfig;
