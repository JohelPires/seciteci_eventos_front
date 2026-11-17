import type { Categoria, Event } from '@/app/page'
import { extrairMensagemErro } from '@/lib/api-error'
import { comBase } from '@/lib/caminho-base'
import { tokenDaSessao } from '@/lib/sessao-clerk'

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
 * - Com `{ autenticado: true }`: injeta o Bearer do token de sessão do Clerk
 *   OBTIDO A CADA REQUEST (o session token expira em ~60s; nada é guardado).
 *   Chamadas públicas ficam sem `Authorization` (sem preflight de CORS à toa).
 * - Em 401 de chamada autenticada (e `redirecionar401`): a sessão acabou —
 *   vai para o /sign-in. Falha de rede propaga o erro normalmente.
 */
export const authFetch = async (
   url: string,
   options: RequestInit = {},
   { autenticado = false, redirecionar401 = true }: { autenticado?: boolean; redirecionar401?: boolean } = {},
): Promise<Response> => {
   const headers = new Headers(options.headers)
   if (autenticado && !headers.has('Authorization')) {
      const token = await tokenDaSessao()
      if (token) headers.set('Authorization', `Bearer ${token}`)
   }

   let res: Response
   try {
      res = await fetch(url, { ...options, headers })
   } catch (error) {
      // Falha de rede: propaga (sem silenciar)
      throw error
   }

   if (!res.ok) {
      // 401 que NÃO é fim de sessão (ex.: erro de perfil tratado pelo AuthContext)
      // não redireciona: os chamadores decidem com `redirecionar401: false`.
      if (res.status === 401 && redirecionar401 && autenticado && typeof window !== 'undefined') {
         // window.location não recebe o basePath do Next: usa comBase.
         window.location.href = comBase('/sign-in')
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
   /** Filtra eventos cuja data de início está no mês (1=janeiro … 12=dezembro). */
   mes?: number
   /** Ano do filtro de mês; só tem efeito junto com `mes`. Padrão da API: ano corrente. */
   ano?: number
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
   const { page = 1, limit = 6, categoria, busca, status = 'publicado', tipo, proximos, ordem, mes, ano } = params
   const res = await authFetch(
      `${API_URL}/api/eventos${querystring({ page, limit, categoria, busca, status, tipo, proximos, ordem, mes, ano })}`,
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
}

/**
 * Lista paginada para o admin. `status=''` (default) = todos os status — sem
 * isso a API defaulta para `publicado` e o painel perdia rascunhos/cancelados.
 */
export const getEventosAdmin = async (params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 10, busca, status = '', tipo, mes, ano } = params
   const res = await authFetch(
      `${API_URL}/api/eventos${querystring({ page, limit, busca, status, tipo, mes, ano })}`,
      {},
      { autenticado: true },
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
}

/** Teto de itens por página imposto pela API (GET /api/eventos). */
const LIMIT_POR_PAGINA = 100

/**
 * Busca TODAS as páginas de uma listagem (a API limita a 100 itens/página).
 * Mescla por `id` para tolerar sobreposição entre requisições.
 */
const buscarTodasAsPaginas = async (
   buscarPagina: (page: number) => Promise<ResultadoEventos>,
): Promise<Event[]> => {
   const primeira = await buscarPagina(1)
   if (primeira.pagination.totalPages <= 1) return primeira.eventos

   const demais = await Promise.all(
      Array.from({ length: primeira.pagination.totalPages - 1 }, (_, i) => buscarPagina(i + 2)),
   )
   const porId = new Map<string, Event>()
   for (const resultado of [primeira, ...demais]) {
      for (const evento of resultado.eventos) porId.set(evento.id, evento)
   }
   return [...porId.values()]
}

/**
 * Todos os eventos cuja data de INÍCIO cai no mês/ano (semântica dos
 * parâmetros `mes`/`ano` da API), paginando até esgotar as páginas.
 * Público (`autenticado` ausente): só publicados, do mais próximo ao mais distante.
 * Admin (`autenticado` + `status`): inclui rascunhos/cancelados conforme `status`.
 */
export const getEventosDoMes = (
   { ano, mes, status, autenticado = false }: { ano: number; mes: number; status?: string; autenticado?: boolean },
): Promise<Event[]> => {
   const buscarPagina = (page: number) =>
      autenticado
         ? getEventosAdmin({ page, limit: LIMIT_POR_PAGINA, status: status ?? '', mes, ano, ordem: 'asc' })
         : getEventos({ page, limit: LIMIT_POR_PAGINA, status: status ?? 'publicado', mes, ano, ordem: 'asc' })
   return buscarTodasAsPaginas(buscarPagina)
}

/** Lista os eventos criados pelo usuário autenticado, paginados no servidor. */
export const getMeusEventos = async (params: EventosParams = {}): Promise<ResultadoEventos> => {
   const { page = 1, limit = 6 } = params
   const res = await authFetch(
      `${API_URL}/api/meus-eventos${querystring({ page, limit })}`,
      {},
      { autenticado: true },
   )
   const data = await res.json()
   return { eventos: normalizarEventos(data?.eventos), pagination: data?.pagination ?? PAGINACAO_VAZIA(page, limit) }
}

export const createEvento = async (evento: Event) => {
   const res = await authFetch(
      `${API_URL}/api/eventos`,
      {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(evento),
      },
      { autenticado: true },
   )
   const data = await res.json()
   return data
}

export const editEvento = async (id: string, eventData: Partial<Event>) => {
   // `categoria` é read-only (o vínculo vem de categoriaId no backend); enviá-la
   // (mesmo null) faz o serializer de update retornar 500. Nunca repassar o campo.
   const payload: Partial<Event> = { ...eventData }
   delete payload.categoria

   const res = await authFetch(
      `${API_URL}/api/eventos/${id}`,
      {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload),
      },
      { autenticado: true },
   )
   const data = await res.json()
   return data
}

export const cancelarEvento = async (id: string, motivo?: string) => {
   const res = await authFetch(
      `${API_URL}/api/eventos/${id}`,
      {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            status: 'cancelado',
            // Motivo opcional; a API limpa o campo automaticamente ao reativar.
            motivoCancelamento: motivo?.trim() || undefined,
         }),
      },
      { autenticado: true },
   )

   const data = await res.json()
   return data
}

export const deleteEvento = async (id: string) => {
   const res = await authFetch(
      `${API_URL}/api/eventos/${id}`,
      { method: 'DELETE' },
      { autenticado: true },
   )
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

export async function createCategoria(newCategoria: Omit<Categoria, 'id'>) {
   const res = await authFetch(
      `${API_URL}/api/categorias`,
      {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(newCategoria),
      },
      { autenticado: true },
   )
   return res.json()
}

export async function updateCategoria(categoria: Categoria) {
   const res = await authFetch(
      `${API_URL}/api/categorias/${categoria.id}`,
      {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(categoria),
      },
      { autenticado: true },
   )
   return res.json()
}

export const deleteCategoria = async (id: string) => {
   const res = await authFetch(
      `${API_URL}/api/categorias/${id}`,
      { method: 'DELETE' },
      { autenticado: true },
   )
   const data = await res.json()
   return data
}

export const getUsuarios = async ({ page = 1, limit = 10, search = '' }: { page?: number; limit?: number; search?: string }) => {
   // O server clampa limit em 100 e NÃO aplica `search`: a busca permanece no cliente.
   // ativo=true: usuários desativados (soft delete) não aparecem na listagem.
   const res = await authFetch(
      `${API_URL}/api/usuarios${querystring({ page, limit, search, ativo: true })}`,
      {},
      { autenticado: true },
   )
   const data = await res.json()
   return data
}

/** Promove um usuário a admin. Sem body; retorna { message, user }. */
export const promoverUsuario = async (id: number) => {
   const res = await authFetch(
      `${API_URL}/api/usuarios/${id}/promover`,
      { method: 'PATCH' },
      { autenticado: true },
   )
   return res.json()
}

/**
 * Desativa um usuário (soft delete, DELETE /api/usuarios/{id}): ativo=false —
 * o middleware da API barra a conta no request seguinte (403). Admins não
 * podem ser desativados (403). Idempotente. O 200 não declara corpo no
 * Swagger, por isso o `.catch(() => null)` evita quebrar em resposta vazia.
 */
export const deleteUsuario = async (id: number) => {
   const res = await authFetch(
      `${API_URL}/api/usuarios/${id}`,
      { method: 'DELETE' },
      { autenticado: true },
   )
   return res.json().catch(() => null)
}

