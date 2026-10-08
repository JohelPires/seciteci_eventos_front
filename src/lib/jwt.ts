// Utilitário puro para decodificar e validar tokens JWT (payload sem verificação de assinatura).
// Não usa dependências externas: decodifica o payload com atob e ajustes de base64url.
// A assinatura NÃO é verificada aqui (impossível no cliente); quem valida de verdade é o backend,
// e requisições inválidas resultam em 401 tratado pelo authFetch em src/data/data.ts.

// Converte uma string em base64url para base64 padrão e decodifica com atob,
// adicionando o padding '=' necessário quando o comprimento não é múltiplo de 4.
const decodificarBase64Url = (entrada: string): string => {
   const base64 = entrada.replace(/-/g, '+').replace(/_/g, '/')
   const resto = base64.length % 4
   const padding = resto === 0 ? '' : '='.repeat(4 - resto)
   return atob(base64 + padding)
}

export interface JwtClaims {
   id?: number
   tipo?: string
   exp?: number
}

// Decodifica e retorna os claims do payload, ou null se não for um JWT parseável.
// O backend emite { id, tipo } no payload (controllers/authController.js) junto do
// `exp` padrão do jwt.sign, mas os campos são opcionais aqui porque este utilitário
// só decodifica — quem valida cada claim é o consumidor (AuthContext).
export const obterClaims = (token: string): JwtClaims | null => {
   const partes = token.split('.')
   if (partes.length !== 3) return null
   try {
      const payload = JSON.parse(decodificarBase64Url(partes[1])) as JwtClaims | null
      if (!payload || typeof payload !== 'object') return null
      return payload
   } catch {
      return null
   }
}

// Decisão fail-closed: qualquer token que não seja um JWT com `exp` válido é inválido.
// O fail-open anterior era justificado por não conhecermos o formato do token; hoje o
// formato é confirmado (jwt.sign com { id, tipo } e expiresIn no backend).
// JWT sem `exp` numérico ou expirado → false.
export const isTokenValid = (token: string): boolean => {
   const claims = obterClaims(token)
   if (!claims || typeof claims.exp !== 'number') return false
   const agoraEmSegundos = Math.floor(Date.now() / 1000)
   return claims.exp > agoraEmSegundos
}
