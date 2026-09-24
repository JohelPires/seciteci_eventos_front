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

// Retorna true apenas se o token tiver 3 partes, payload decodificável
// e `exp` (segundos desde o epoch) maior que o momento atual.
// Token malformado, sem `exp` ou expirado → false.
export const isTokenValid = (token: string): boolean => {
   const partes = token.split('.')
   if (partes.length !== 3) return false

   try {
      const payload = JSON.parse(decodificarBase64Url(partes[1])) as { exp?: unknown } | null
      if (!payload || typeof payload.exp !== 'number') return false
      const agoraEmSegundos = Math.floor(Date.now() / 1000)
      return payload.exp > agoraEmSegundos
   } catch {
      return false
   }
}
