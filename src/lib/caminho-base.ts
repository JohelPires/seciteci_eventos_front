/**
 * O CAMINHO BASE do app — na VM da SECITECI, o `APP_CAMINHO` do build
 * (`/dev/secitec/conectese`); vazio no dev local (o app na raiz). O
 * `next.config.mjs` o põe em `basePath` (e `assetPrefix`), e o Next expõe
 * a variável como `process.env.NEXT_PUBLIC_BASE_PATH` (inlinada no build,
 * servidor e navegador — padrão de `apps/admin/lib/caminho-base.ts` do
 * portal-inovacao-web).
 *
 * O `basePath` do Next já prefixa sozinho o `<Link>`, o `router.push`, o
 * `redirect()` e os `_next/…`. Este helper é para o que ele NÃO prefixa:
 * `src` de imagem que aponta para `public/`, `window.location.href` e os
 * ícones do `metadata`.
 */
export const CAMINHO_BASE: string = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** `comBase('/conecte-se.webp')` → `/dev/…/conecte-se.webp` (na raiz, igual). */
export function comBase(caminho: string, base: string = CAMINHO_BASE): string {
   if (!base) return caminho
   // Garante exatamente uma barra entre o base e o caminho.
   const sufixo = caminho.startsWith('/') ? caminho : `/${caminho}`
   return `${base}${sufixo}`
}
