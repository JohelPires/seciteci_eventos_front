/**
 * Integração com o Google Identity Services (GIS) para o login com Google.
 *
 * O fluxo é o de ID token: o GIS entrega o `credential` (ID token do Google)
 * e o backend (`POST /api/auth/google`) valida a audience contra a própria
 * `GOOGLE_CLIENT_ID` e devolve o JWT da API. Sem redirect e sem segredo no
 * front — o Client ID é público por natureza.
 *
 * A env `NEXT_PUBLIC_GOOGLE_CLIENT_ID` é inlinada NO BUILD (padrão das
 * `NEXT_PUBLIC_*` do projeto): trocar de Client ID = re-buildar.
 */

const URL_SCRIPT_GIS = 'https://accounts.google.com/gsi/client'

export const GOOGLE_CLIENT_ID: string = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

/** O login com Google só aparece quando há Client ID no build. */
export const googleLoginConfigured = (): boolean => GOOGLE_CLIENT_ID.trim() !== ''

// Promise singleton do carregamento: o diálogo pode montar/desmontar várias
// vezes, e reprocessar a injeção do script causaria tags duplicadas. Em falha,
// a promise é descartada para permitir nova tentativa na próxima abertura.
let carregandoScript: Promise<void> | null = null

/** Carrega o script do GIS uma única vez; resolve quando `google` está global. */
export const carregarGoogleIdentity = (): Promise<void> => {
   if (typeof window === 'undefined') {
      return Promise.reject(new Error('Google Identity: indisponível fora do navegador'))
   }
   if (window.google?.accounts?.id) {
      return Promise.resolve()
   }
   if (carregandoScript) {
      return carregandoScript
   }

   carregandoScript = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = URL_SCRIPT_GIS
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
         carregandoScript = null
         script.remove()
         reject(new Error('Falha ao carregar o Google Identity Services'))
      }
      document.head.appendChild(script)
   })

   return carregandoScript
}
