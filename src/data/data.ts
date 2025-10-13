const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getEventos = async () => {
   const res = await fetch(`${API_URL}/api/eventos`)
   console.info(API_URL)
   console.info(res)
   const data = await res.json()
   return data
}
