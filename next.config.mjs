/** @type {import('next').NextConfig} */

// CSP pragmática: o app carrega Leaflet de unpkg.com (script/style), tiles do OSM
// (img), imagens de capa de domínios arbitrários (img-src https:), chama uma API
// externa definida em build (origem liberada em connect-src) e usa o Clerk no
// login (script/connect/frame/worker do host da instância + Turnstile).
// Endurecer atrás de nonce é passo futuro (o painel do Portal faz por request).

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

// Clerk (login): o host do "Frontend API" sai da publishable key —
// `pk_(test|live)_` + base64 de `<host>$`. Sem chave válida o build de
// produção falha (padrão "a app não sobe com configuração errada"; no dev
// local, o login simplesmente não funciona sem a chave).
const hostDaChave = (publishableKey) => {
   const m = publishableKey?.match(/^pk_(?:test|live)_(.+)$/)
   if (!m) return null
   try {
      const host = Buffer.from(m[1], 'base64').toString('utf8').replace(/\$$/, '')
      return /^[a-z0-9.-]+$/i.test(host) ? host : null
   } catch {
      return null
   }
}

const CHAVE_CLERK = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
const HOST_CLERK = hostDaChave(CHAVE_CLERK)

if (!HOST_CLERK) {
   const emProducao = process.env.NODE_ENV === 'production'
   const msg =
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ausente ou malformada (esperado pk_test_…/pk_live_…). ' +
      'Copie a chave da instância do ambiente em dashboard.clerk.com → API keys para o .env.local/.ambiente.'
   if (emProducao) throw new Error(msg)
   console.warn(`[next.config] ${msg}`)
}

// Origens que o Clerk precisa (defaults do createContentSecurityPolicyHeaders
// do @clerk/nextjs, mantidos aqui porque a CSP é estática e sem nonce):
// - o host da instância em script/connect;
// - Turnstile da Cloudflare e o guardião protect.clerk.com em script/frame;
// - telemetria em connect-src;
// - worker `blob:` do Turnstile.
const origensClerk = HOST_CLERK
   ? [
        `https://${HOST_CLERK}`,
        'https://challenges.cloudflare.com',
        'https://*.protect.clerk.com',
        'https://clerk-telemetry.com',
        'https://*.clerk-telemetry.com',
     ]
   : []
const hostClerk = origensClerk[0]
const origensGuardiao = origensClerk.slice(1, 3)

// Caminho base (endereço por CAMINHO na VM da SECITECI): o pipeline passa
// APP_CAMINHO no build e ele vira `basePath`/`assetPrefix` do Next; vazio
// no dev local (app na raiz). Trocar de endereço = re-buildar.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const csp = [
   "default-src 'self'",
   // host do Clerk + Turnstile + protect.clerk.com; accounts.google.com fica
   // enquanto o OAuth do Google circular por lá.
   `script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com https://accounts.google.com ${[hostClerk, ...origensGuardiao].filter(Boolean).join(' ')}`.trim(),
   "style-src 'self' 'unsafe-inline' unpkg.com",
   "img-src 'self' data: https: blob:",
   "font-src 'self' data:",
   [`frame-src 'self' https://accounts.google.com`, ...origensGuardiao].filter(Boolean).join(' ').trim(),
   // worker do Turnstile (blob:) — sem o Clerk, fica em 'self'.
   `worker-src 'self' blob:`,
   [`connect-src 'self' https: wss:`, apiOrigem, hostClerk, 'https://clerk-telemetry.com', 'https://*.clerk-telemetry.com', 'https://*.protect.clerk.com'].filter(Boolean).join(' ').trim(),
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
