import { Categoria, Event } from '@/app/page'
import { extrairMensagemErro } from '@/lib/api-error'
import { comBase } from '@/lib/caminho-base'

const API_URL = process.env.NEXT_PUBLIC_API_URL

/** Erro de API com status HTTP e mensagem do corpo quando disponível. */
export class ApiError extends Error {
   status: number

   constructor(status: number, mensagem?: string) {
      super(mensagem || `Erro na requisição (status ${status})`)
      this.name = 'ApiError'
      this.status = status
   }
}

/**
 * Helper central de fetch para todas as chamadas à API.
 * - Lança ApiError quando a resposta não é OK (status incluído).
 * - Em 401: limpa as chaves de autenticação do localStorage e redireciona para '/'.
 * - Falha de rede propaga o erro normalmente.
 */
export const authFetch = async (
   url: string,
   options: RequestInit = {},
   { redirecionar401 = true }: { redirecionar401?: boolean } = {},
): Promise<Response> => {
   let res: Response
   try {
      res = await fetch(url, options)
   } catch (error) {
      // Falha de rede: propaga (sem silenciar)
      throw error
   }

   if (!res.ok) {
      // 401 que NÃO é fim de sessão (ex.: senha atual incorreta) não desloga o usuário
      if (res.status === 401 && redirecionar401 && typeof window !== 'undefined') {
         localStorage.removeItem('authToken')
         localStorage.removeItem('authUser')
         // window.location não recebe o basePath do Next: usa comBase.
         window.location.href = comBase('/')
      }

      let mensagem: string | undefined
      try {
         const corpo = await res.json()
         mensagem = extrairMensagemErro(corpo, `Erro na requisição (status ${res.status})`)
      } catch {
         // corpo sem JSON: usa mensagem padrão
      }
      throw new ApiError(res.status, mensagem)
   }

   return res
}

export const getEventos = async () => {
   const res = await authFetch(`${API_URL}/api/eventos?status=publicado&limit=1000`)

   const data = await res.json()

   // await new Promise((resolve) => setTimeout(resolve, 3000))

   return data
}

export const getEventosFullQuery = async (
   categoria: string | null = '',
   cidade: string | null = '',
   status: 'publicado' | 'rascunho' | 'cancelado' | null = 'publicado',
   tipo: 'presencial' | 'online' | 'hibrido' | null = 'presencial',
   busca: string | null = '',
   page: number | null = 1,
   limit: number | null = 10,
) => {
   const res = await authFetch(
      `${API_URL}/api/eventos?categoria=${encodeURIComponent(categoria ?? '')}&cidade=${encodeURIComponent(cidade ?? '')}&status=${status}&tipo=${tipo}&busca=${encodeURIComponent(busca ?? '')}&page=${page}&limit=${limit}`,
   )
   const data = await res.json()

   return data
}

export const getEventosAdmin = async (token: string | null) => {
   const res = await authFetch(`${API_URL}/api/eventos?limit=1000`, {
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()

   return data
}

/**
 * Lista os eventos criados pelo usuário informado.
 * Não há endpoint dedicado no backend: busca a lista completa (todos os status)
 * e filtra client-side por organizadorId. Comparação NaN-safe.
 */
export const getMeusEventos = async (token: string | null, userId: number): Promise<Event[]> => {
   const data = await getEventosAdmin(token)
   const eventos: Event[] = data?.eventos ?? []
   return eventos.filter((evento) => Number(evento.organizadorId) === userId)
}

export const createEvento = async (evento: Event, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/eventos`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(evento),
   })
   const data = await res.json()
   return data
}

export const editEvento = async (id: string, eventData: Partial<Event>, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(eventData),
   })
   const data = await res.json()
   return data
}

export const cancelarEvento = async (id: string, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'rascunho' }), // 👈 Apenas alteramos o status
   })

   const data = await res.json()
   return data
}

export const deleteEvento = async (id: string, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/eventos/${id}`, {
      method: 'DELETE',
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return data
}

export const getLocais = async () => {
   const res = await authFetch(`${API_URL}/api/locais`)
   const data = await res.json()
   return data.locais
}

export const getCategorias = async () => {
   const res = await authFetch(`${API_URL}/api/categorias`)

   const data = await res.json()
   return data.categorias
}

export async function createCategoria(newCategoria: Omit<Categoria, 'id'>, token: string | null) {
   const res = await authFetch(`${API_URL}/api/categorias`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCategoria),
   })
   return res.json()
}

export async function updateCategoria(categoria: Categoria, token: string | null) {
   const res = await authFetch(`${API_URL}/api/categorias/${categoria.id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(categoria),
   })
   return res.json()
}

export const deleteCategoria = async (id: string, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/categorias/${id}`, {
      method: 'DELETE',
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return data
}

export const getUsuarios = async ({ queryKey }: { queryKey: [string, { token: string | null; search: string }] }) => {
   if (queryKey[1].token === null) return { erro: 'Nao autorizado' }
   const [_key, { token, search }] = queryKey
   const res = await authFetch(`${API_URL}/api/usuarios?limit=1000&search=${encodeURIComponent(search)}`, {
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return data
}

/** Promove um usuário a admin. Sem body; retorna { message, user }. */
export const promoverUsuario = async (id: number, token: string | null) => {
   const res = await authFetch(`${API_URL}/api/usuarios/${id}/promover`, {
      method: 'PATCH',
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   return res.json()
}

/**
 * Altera a senha do usuário autenticado (PATCH /api/auth/senha).
 * O 401 aqui significa "senha atual incorreta" (ou sessão expirada): o
 * redirecionar401: false evita deslogar o usuário ao errar a senha atual.
 */
export const alterarSenha = async (
   dados: { senhaAtual: string; novaSenha: string },
   token: string | null,
): Promise<void> => {
   await authFetch(
      `${API_URL}/api/auth/senha`,
      {
         method: 'PATCH',
         headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
         },
         body: JSON.stringify(dados),
      },
      { redirecionar401: false },
   )
}
