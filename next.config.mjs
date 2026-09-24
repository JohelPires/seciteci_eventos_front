/** @type {import('next').NextConfig} */

// CSP pragmática: o app carrega Leaflet de unpkg.com (script/style), tiles do OSM
// (img), imagens de capa de domínios arbitrários (img-src https:) e chama uma API
// externa definida em build (connect-src https:). Endurecer atrás de nonce e fixar
// o domínio da API em connect-src são passos futuros.
const csp = [
   "default-src 'self'",
   "script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com",
   "style-src 'self' 'unsafe-inline' unpkg.com",
   "img-src 'self' data: https: blob:",
   "font-src 'self' data:",
   "connect-src 'self' https: wss:",
   "frame-ancestors 'none'",
   "base-uri 'self'",
   "form-action 'self'",
   "object-src 'none'",
].join("; ")

const nextConfig = {
   reactStrictMode: true,
   outputFileTracingRoot: import.meta.dirname,
   async headers() {
      return [
         {
            source: "/:path*",
            headers: [
               { key: "X-Frame-Options", value: "DENY" },
               { key: "X-Content-Type-Options", value: "nosniff" },
               { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
               { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
               { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
               { key: "Content-Security-Policy", value: csp },
            ],
         },
      ]
   },
}

export default nextConfig
