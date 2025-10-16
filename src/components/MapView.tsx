/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from 'react'
import { MapPin, Video, Globe, Calendar, Clock, Users, X } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Event, Categoria, Local } from '@/app/page'

interface MapViewProps {
   events: Event[]
   categorias: Categoria[]
   locais: Local[]
   onEventClick: (event: Event) => void
}

export function MapView({ events, categorias, locais, onEventClick }: MapViewProps) {
   const mapRef = useRef<HTMLDivElement>(null)
   const mapInstanceRef = useRef<any>(null)
   const markersRef = useRef<any[]>([])
   const [selectedMarkerEvent, setSelectedMarkerEvent] = useState<Event | null>(null)
   const [leafletLoaded, setLeafletLoaded] = useState(false)

   //  const getCategoria = (id: number) => categorias.find((c) => c.id === id)
   //  const getLocal = (id: number) => locais.find((l) => l.id === id)

   // Load Leaflet CSS and JS
   useEffect(() => {
      // Add Leaflet CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // Load Leaflet JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''
      script.onload = () => {
         setLeafletLoaded(true)
      }
      document.head.appendChild(script)

      return () => {
         if (link.parentNode) {
            link.parentNode.removeChild(link)
         }
         if (script.parentNode) {
            script.parentNode.removeChild(script)
         }
      }
   }, [])

   // Initialize map
   useEffect(() => {
      if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return

      const L = (window as any).L
      if (!L) return

      // Center of Brazil
      const map = L.map(mapRef.current).setView([-15.7942, -47.8822], 4)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
         maxZoom: 18,
      }).addTo(map)

      mapInstanceRef.current = map

      // Fix map display issues
      setTimeout(() => {
         map.invalidateSize()
      }, 100)

      return () => {
         if (mapInstanceRef.current) {
            mapInstanceRef.current.remove()
            mapInstanceRef.current = null
         }
      }
   }, [leafletLoaded])

   // Add markers for events
   useEffect(() => {
      if (!mapInstanceRef.current || !leafletLoaded) return

      const L = (window as any).L
      if (!L) return

      // Clear existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Get events with locations that have coordinates
      const eventsWithCoords = events.filter((event) => {
         const local = event.local
         return local && local.latitude && local.longitude
      })

      if (eventsWithCoords.length === 0) return

      // Create custom icon function
      const createCustomIcon = (color: string) => {
         return L.divIcon({
            html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
            className: 'custom-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
         })
      }

      // Add markers
      eventsWithCoords.forEach((event) => {
         const local = event.local
         //  const categoria = event.categoria

         if (!local || !local.latitude || !local.longitude) return

         // Get color from category
         const color = event.categoria?.cor.includes('bg-')
            ? {
                 'bg-blue-600': '#2563eb',
                 'bg-slate-700': '#334155',
                 'bg-indigo-600': '#4f46e5',
                 'bg-purple-600': '#9333ea',
                 'bg-orange-600': '#ea580c',
                 'bg-teal-600': '#0d9488',
                 'bg-green-600': '#16a34a',
              }[event.categoria.cor] || '#64748b'
            : '#64748b'

         const marker = L.marker([local.latitude, local.longitude], {
            icon: createCustomIcon(color),
         }).addTo(mapInstanceRef.current)

         const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${event.titulo}</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">${event.descricao.substring(0, 80)}${
            event.descricao.length > 80 ? '...' : ''
         }</p>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px; font-size: 12px;">
            <span>📅</span>
            <span>${new Date(event.dataInicio).toLocaleDateString('pt-BR')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px; font-size: 12px;">
            <span>🕐</span>
            <span>${event.horarioAbertura.substring(11, 16)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
            <span>📍</span>
            <span>${local.nome}</span>
          </div>
        </div>
      `

         marker.bindPopup(popupContent)

         marker.on('click', () => {
            setSelectedMarkerEvent(event)
         })

         markersRef.current.push(marker)
      })

      // Fit bounds to show all markers
      if (eventsWithCoords.length > 0) {
         const bounds = L.latLngBounds(
            eventsWithCoords.map((event) => {
               const local = event.local
               return [local!.latitude, local!.longitude]
            })
         )
         mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
      }
   }, [events, leafletLoaded, categorias, locais])

   const getTipoEventoIcon = (tipo: string) => {
      switch (tipo) {
         case 'online':
            return <Video className="w-4 h-4" />
         case 'hibrido':
            return <Globe className="w-4 h-4" />
         default:
            return <MapPin className="w-4 h-4" />
      }
   }

   return (
      <div className="relative h-[calc(100vh-400px)] min-h-[500px] rounded-lg overflow-hidden border border-border shadow-lg">
         <div ref={mapRef} className="w-full h-full z-0" />

         {/* Event Details Card */}
         {selectedMarkerEvent &&
            (() => {
               const categoria = selectedMarkerEvent.categoria
               const local = selectedMarkerEvent.local
               const categoryStyle = selectedMarkerEvent.categoria?.cor || 'bg-slate-600'

               return (
                  <Card className="absolute top-4 right-4 w-80 max-w-[calc(100%-2rem)] shadow-2xl z-[1000] max-h-[calc(100%-2rem)] overflow-auto">
                     <CardHeader className="relative pb-3">
                        <Button
                           variant="ghost"
                           size="sm"
                           className="absolute top-2 right-2 h-8 w-8 p-0"
                           onClick={() => setSelectedMarkerEvent(null)}
                        >
                           <X className="h-4 w-4" />
                        </Button>
                        <CardTitle className="pr-8">{selectedMarkerEvent.titulo}</CardTitle>
                        <div className="flex gap-2">
                           {categoria && (
                              <Badge className={`${categoryStyle} text-white border-0 w-fit`}>{categoria.nome}</Badge>
                           )}
                           <Badge
                              className={`${
                                 selectedMarkerEvent.status === 'publicado'
                                    ? 'bg-green-600'
                                    : selectedMarkerEvent.status === 'rascunho'
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                              } text-white border-0 w-fit`}
                           >
                              {selectedMarkerEvent.status}
                           </Badge>
                        </div>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        {selectedMarkerEvent.imagemCapa && (
                           <img
                              src={selectedMarkerEvent.imagemCapa}
                              alt={selectedMarkerEvent.titulo}
                              className="w-full h-40 object-cover rounded-md"
                           />
                        )}

                        {/* <p className="text-sm text-muted-foreground">{selectedMarkerEvent.descricao}</p> */}

                        <div className="space-y-2">
                           <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span>
                                 {new Date(selectedMarkerEvent.dataInicio).toLocaleDateString('pt-BR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                 })}
                              </span>
                           </div>

                           <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span>
                                 {selectedMarkerEvent.horarioAbertura.substring(11, 16)} -{' '}
                                 {selectedMarkerEvent.horarioEncerramento.substring(11, 16)}
                              </span>
                           </div>

                           <div className="flex items-center gap-2 text-sm">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{selectedMarkerEvent.capacidadeMaxima} pessoas</span>
                           </div>

                           <div className="flex items-center gap-2 text-sm">
                              {getTipoEventoIcon(selectedMarkerEvent.tipoEvento)}
                              <span className="capitalize">{selectedMarkerEvent.tipoEvento}</span>
                           </div>

                           {local && (
                              <div className="flex items-start gap-2 text-sm">
                                 <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                                 <div>
                                    <p>{local.nome}</p>
                                    <p className="text-xs text-muted-foreground">
                                       {local.endereco}, {local.numero} - {local.cidade}/{local.estado}
                                    </p>
                                 </div>
                              </div>
                           )}
                        </div>

                        <Button onClick={() => onEventClick(selectedMarkerEvent)} className="w-full">
                           Ver Detalhes Completos
                        </Button>
                     </CardContent>
                  </Card>
               )
            })()}

         {/* Info Card */}
         <Card className="absolute bottom-4 left-4 shadow-xl z-[1000]">
            <CardContent className="p-4">
               <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                     <p className="text-sm">
                        {
                           events.filter((e) => {
                              const local = e.local
                              return local && local.latitude && local.longitude
                           }).length
                        }{' '}
                        eventos no mapa
                     </p>
                  </div>
               </div>
            </CardContent>
         </Card>
      </div>
   )
}
