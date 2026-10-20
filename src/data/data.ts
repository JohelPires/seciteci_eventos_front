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

/**
 * A API pode devolver `null` em campos de texto (eventos legados sem
 * `titulo`/`descricao`). Normaliza para string vazia para que
 * `.length`/`.toLowerCase()`/`.substring()` nunca quebrem no front.
 */
const normalizarEvento = (evento: Event): Event => ({
   ...evento,
   titulo: evento.titulo ?? '',
   descricao: evento.descricao ?? '',
   motivoCancelamento: evento.motivoCancelamento ?? '',
   financiadores: (evento.financiadores ?? []).filter((f) => typeof f?.nome === 'string' && f.nome.trim() !== ''),
})

const normalizarEventos = (eventos: Event[] | undefined | null): Event[] =>
   (eventos ?? []).map(normalizarEvento)

/** Metadados de paginação devolvidos pela API. */
export interface Pagination {
   page: number
   limit: number
   total: number
   totalPages: number
}

export interface EventosParams {
   page?: number
   limit?: number
   categoria?: string
   busca?: string
   status?: string
   tipo?: string
   /** Quando true, a API retorna apenas eventos que terminam hoje ou depois. */
   proximos?: boolean
   /** Direção da ordenação por data de início (padrão da API: desc). */
   ordem?: 'asc' | 'desc'
}

export interface ResultadoEventos {
   eventos: Event[]
   pagination: Pagination
}

const PAGINACAO_VAZIA = (page: number, limit: number): Pagination => ({
   page,
   limit,
   total: 0,
   totalPages: 0,
})

/**
 * Monta a querystring. `status` é o único parâmetro cuja string vazia tem
 * semântica na API (`status=` = TODOS os status; omitir = só `publicado`),
 * então ele é sempre enviado quando definido.
 */
const querystring = (params: Record<string, string | number | boolean | undefined>): string => {
   const qs = new URLSearchParams()
   for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue
      if (k !== 'status' && v === '') continue
      qs.set(k, String(v))
   }
   const s = qs.toString()
   return s ? `?${s}` : ''
}

/** Lista pública paginada com filtros server-side. Default: só publicados. */
export const getEventos = async (params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 6, categoria, busca, status = 'publicado', tipo, proximos, ordem } = params
   const res = await authFetch(
      `${API_URL}/api/eventos${querystring({ page, limit, categoria, busca, status, tipo, proximos, ordem })}`,
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
}

/**
 * Lista paginada para o admin. `status=''` (default) = todos os status — sem
 * isso a API defaulta para `publicado` e o painel perdia rascunhos/cancelados.
 */
export const getEventosAdmin = async (token: string | null, params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 10, busca, status = '', tipo } = params
   const res = await authFetch(
      `${API_URL}/api/eventos${querystring({ page, limit, busca, status, tipo })}`,
      {
         headers: {
            Authorization: `Bearer ${token}`,
         },
      },
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
}

/** Lista os eventos criados pelo usuário autenticado, paginados no servidor. */
export const getMeusEventos = async (token: string | null, params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 6 } = params
   const res = await authFetch(`${API_URL}/api/meus-eventos${querystring({ page, limit })}`, {
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
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
   // `categoria` é read-only (o vínculo vem de categoriaId no backend); enviá-la
   // (mesmo null) faz o serializer de update retornar 500. Nunca repassar o campo.
   const payload: Partial<Event> = { ...eventData }
   delete payload.categoria

   const res = await authFetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
   })
   const data = await res.json()
   return data
}

export const cancelarEvento = async (id: string, token: string | null, motivo?: string) => {
   const res = await authFetch(`${API_URL}/api/eventos/${id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
         status: 'cancelado',
         // Motivo opcional; a API limpa o campo automaticamente ao reativar.
         motivoCancelamento: motivo?.trim() || undefined,
      }),
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

export const getUsuarios = async ({
   page = 1,
   limit = 10,
   token = null,
   search = '',
}: {
   page?: number
   limit?: number
   token: string | null
   search?: string
}) => {
   // O server clampa limit em 100 e NÃO aplica `search`: a busca permanece no cliente.
   const res = await authFetch(`${API_URL}/api/usuarios${querystring({ page, limit, search })}`, {
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

/**
 * Solicita o código de recuperação (POST /api/auth/esqueci-senha).
 * A resposta é sempre 200 genérico (o backend não revela quais e-mails existem);
 * rotas públicas: redirecionar401: false evita jogar o usuário para a home.
 */
export const esqueciSenha = async (email: string): Promise<void> => {
   await authFetch(
      `${API_URL}/api/auth/esqueci-senha`,
      {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify({ email }),
      },
      { redirecionar401: false },
   )
}

/**
 * Redefine a senha com o código recebido por e-mail (POST /api/auth/redefinir-senha).
 * 400 = dados inválidos ou código inválido/expirado (máx. 5 tentativas).
 */
export const redefinirSenha = async (dados: { email: string; codigo: string; novaSenha: string }): Promise<void> => {
   await authFetch(
      `${API_URL}/api/auth/redefinir-senha`,
      {
         method: 'POST',
         headers: {
            'Content-Type': 'application/json',
         },
         body: JSON.stringify(dados),
      },
      { redirecionar401: false },
   )
}
