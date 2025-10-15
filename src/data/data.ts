import { Event } from '@/app/page'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getEventos = async () => {
   const res = await fetch(`${API_URL}/api/eventos?status=publicado&limit=1000`)

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
