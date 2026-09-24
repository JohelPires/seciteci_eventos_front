// Utilitário puro para validar a expiração (claim `exp`) de um token JWT.
// Não usa dependências externas: decodifica o payload com atob e ajustes de base64url.

// Converte uma string em base64url para base64 padrão e decodifica com atob,
// adicionando o padding '=' necessário quando o comprimento não é múltiplo de 4.
const decodificarBase64Url = (entrada: string): string => {
   const base64 = entrada.replace(/-/g, '+').replace(/_/g, '/')
   const resto = base64.length % 4
   const padding = resto === 0 ? '' : '='.repeat(4 - resto)
   return atob(base64 + padding)
}

// Valida apenas a expiração (claim `exp`) de um token que tenha o formato JWT.
// Decisão fail-open consciente: token sem 3 partes (não-JWT) é considerado VÁLIDO aqui,
// porque o backend é quem valida o token de verdade; um token inválido/ausente resulta
// em 401, que já é tratado pelo authFetch em src/data/data.ts. Assim evitamos deslogar
// o usuário por um falso negativo local (ex.: formato opaco usado pelo backend).
// Quando o token É um JWT, retorna true apenas se o payload decodificar e `exp`
// (segundos desde o epoch) for maior que o momento atual; JWT sem `exp` ou expirado → false.
export const isTokenValid = (token: string): boolean => {
   const partes = token.split('.')
   if (partes.length !== 3) return true

   try {
      const payload = JSON.parse(decodificarBase64Url(partes[1])) as { exp?: unknown } | null
      if (!payload || typeof payload.exp !== 'number') return false
      const agoraEmSegundos = Math.floor(Date.now() / 1000)
      return payload.exp > agoraEmSegundos
   } catch {
      return false
   }
}
