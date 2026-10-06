/**
 * Extrai a mensagem de erro do corpo de uma resposta da API.
 * O backend usa dois formatos:
 * - Validação (400): { errors: [{ msg, path, ... }] }
 * - Auth/domínio (401, 409...): { error: string } ou { message: string }
 */
export const extrairMensagemErro = (errorData: unknown, fallback: string): string => {
   if (!errorData || typeof errorData !== 'object') return fallback
   const dados = errorData as { errors?: { msg?: unknown }[]; error?: unknown; message?: unknown }

   if (Array.isArray(dados.errors) && dados.errors.length > 0) {
      const mensagens = dados.errors
         .map((e) => (typeof e?.msg === 'string' ? e.msg : null))
         .filter((msg): msg is string => !!msg)
      if (mensagens.length > 0) {
         return mensagens.join(', ')
      }
   }

   if (typeof dados.error === 'string') return dados.error
   if (typeof dados.message === 'string') return dados.message
   return fallback
}
