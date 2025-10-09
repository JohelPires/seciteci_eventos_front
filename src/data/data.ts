const API_URL = process.env.NEXT_PUBLIC_API_URL

export const getEventos = async () => {
   console.log(API_URL)
   const res = await fetch(`${API_URL}/api/eventos`)
   console.log(res)
   const data = await res.json()
   return data
}
