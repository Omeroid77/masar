/** Static export: `npm run build` writes a plain static site to out/ (any static host works). */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
