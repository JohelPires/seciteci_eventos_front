const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getEventos = async () => {
   const res = await fetch(`${API_URL}/api/eventos`)
   // console.info(API_URL)
   // console.info(res)
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
