import { Categoria, Event } from '@/app/page'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getEventos = async () => {
   const res = await fetch(`${API_URL}/api/eventos?status=publicado&limit=1000`)

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
   const res = await fetch(
      `${API_URL}/api/eventos?categoria=${categoria}&cidade=${cidade}&status=${status}&tipo=${tipo}&busca=${busca}&page=${page}&limit=${limit}`,
   )
   const data = await res.json()

   return data
}

export const getEventosAdmin = async (token: string | null) => {
   const res = await fetch(`${API_URL}/api/eventos?limit=1000`, {
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()

   return data
}

export const createEvento = async (evento: Event, token: string | null) => {
   const res = await fetch(`${API_URL}/api/eventos`, {
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
   const res = await fetch(`${API_URL}/api/eventos/${id}`, {
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
   const res = await fetch(`${API_URL}/api/eventos/${id}`, {
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
   const res = await fetch(`${API_URL}/api/eventos/${id}`, {
      method: 'DELETE',
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return data
}

export const getLocais = async () => {
   const res = await fetch(`${API_URL}/api/locais`)
   const data = await res.json()
   return data.locais
}

export const getCategorias = async () => {
   const res = await fetch(`${API_URL}/api/categorias`)

   const data = await res.json()
   return data.categorias
}

export async function createCategoria(newCategoria: Omit<Categoria, 'id'>, token: string | null) {
   const res = await fetch(`${API_URL}/api/categorias`, {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newCategoria),
   })
   if (!res.ok) throw new Error('Erro ao criar categoria')
   return res.json()
}

export async function updateCategoria(categoria: Categoria, token: string | null) {
   const res = await fetch(`${API_URL}/api/categorias/${categoria.id}`, {
      method: 'PUT',
      headers: {
         'Content-Type': 'application/json',
         Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(categoria),
   })
   if (!res.ok) throw new Error('Erro ao atualizar categoria')
   return res.json()
}

export const deleteCategoria = async (id: string, token: string | null) => {
   const res = await fetch(`${API_URL}/api/categorias/${id}`, {
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
   const res = await fetch(`${API_URL}/api/usuarios?limit=1000&search=${search}`, {
      headers: {
         Authorization: `Bearer ${token}`,
      },
   })
   const data = await res.json()
   return data
}
