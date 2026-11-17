/**
 * Ponte entre o `getToken()` do Clerk e o `authFetch` (src/data/data.ts).
 *
 * O session token do Clerk é CURTO (~60s): ele NÃO pode ficar em estado
 * (localStorage/useState) como o JWT antigo. O AuthContext registra o
 * `getToken` do hook `useAuth()` do Clerk no carregamento, e o `authFetch`
 * chama `tokenDaSessao()` a cada request — o Clerk renova sozinho quando
 * o token está perto de expirar.
 *
 * Sem registro (SSR do primeiro HTML, ou antes do provider montar), devolve
 * null: as chamadas públicas seguem sem `Authorization` (e sem preflight de
 * CORS desnecessário).
 */
type ObterToken = () => Promise<string | null>

let obterToken: ObterToken | null = null

/** Registrado pelo AuthContext; `null` no desmonte. */
export const registrarObterToken = (fn: ObterToken | null): void => {
   obterToken = fn
}

/** Token de sessão fresco do Clerk, ou null sem sessão/registro. */
export const tokenDaSessao = async (): Promise<string | null> => {
   if (!obterToken) return null
   try {
      return await obterToken()
   } catch {
      return null
   }
}
