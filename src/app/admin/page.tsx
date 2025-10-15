'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { EventForm } from '@/components/EventForm'
import { EventCard } from '@/components/EventCard'
import { Pagination } from '@/components/ui/pagination'
import { CalendarView } from '@/components/CalendarView'
import { getEventos } from '@/data/data'

function AdminPage() {
   const { isAuthenticated, user } = useAuth()
   const [events, setEvents] = useState<Event[]>([])
   const [pageIndex, setPageIndex] = useState<number>(0)

   useEffect(() => {
      async function fetchData() {
         try {
            const response = await getEventos()
            console.log(response)
            setEvents(response.eventos)
         } catch (error) {
            console.log(error)
         }
      }

      fetchData()
   }, [])

   const handlePageChange = (newPageIndex: number) => {
      setPageIndex(newPageIndex)
   }

   return (
      <div className="flex flex-col gap-4">
         <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Painel Administrador</h2>
            {/* <EventForm /> */}
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* {events.map((event) => (
                <EventCard key={event.id} event={event} />
             ))} */}
         </div>
         {/* <Pagination pageSize={6} onPageChange={handlePageChange} pageIndex={pageIndex} /> */}
         {/* <CalendarView /> */}
      </div>
   )
}

export default AdminPage
