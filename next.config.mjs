/** @type {import('next').NextConfig} */

// CSP pragmática: o app carrega Leaflet de unpkg.com (script/style), tiles do OSM
// (img), imagens de capa de domínios arbitrários (img-src https:) e chama uma API
// externa definida em build (origem liberada em connect-src). Endurecer atrás de
// nonce é passo futuro.

// Origem da API (NEXT_PUBLIC_API_URL) liberada em connect-src; em dev cobre
// http://localhost:3030, em produção o host https da API.
let apiOrigem = ''
try {
   if (process.env.NEXT_PUBLIC_API_URL) {
      apiOrigem = new URL(process.env.NEXT_PUBLIC_API_URL).origin
   }
} catch {
   // URL inválida: segue sem liberar origem extra
}

// Caminho base (endereço por CAMINHO na VM da SECITECI): o pipeline passa
// APP_CAMINHO no build e ele vira `basePath`/`assetPrefix` do Next; vazio
// no dev local (app na raiz). Trocar de endereço = re-buildar.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const csp = [
   "default-src 'self'",
   "script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com",
   "style-src 'self' 'unsafe-inline' unpkg.com",
   "img-src 'self' data: https: blob:",
   "font-src 'self' data:",
   ["connect-src 'self' https: wss:", apiOrigem].filter(Boolean).join(' '),
   "frame-ancestors 'none'",
   "base-uri 'self'",
   "form-action 'self'",
   "object-src 'none'",
].join("; ")

const nextConfig = {
   reactStrictMode: true,
   basePath,
   assetPrefix: basePath || undefined,
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
