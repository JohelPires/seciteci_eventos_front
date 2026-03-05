/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useMemo } from 'react'
import { MapPin, Video, Globe, Calendar, Clock, Users, X } from 'lucide-react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'
import { Checkbox } from './ui/checkbox'
import type { Event, Categoria } from '@/app/page'

interface MapViewProps {
    events: Event[]
    categorias: Categoria[]
    // locais: Local[]
    onEventClick: (event: Event) => void
}

export function MapView({ events, categorias, onEventClick }: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstanceRef = useRef<any>(null)
    const markersRef = useRef<any[]>([])
    const [selectedMarkerEvent, setSelectedMarkerEvent] =
        useState<Event | null>(null)
    const [leafletLoaded, setLeafletLoaded] = useState(false)

    const today = new Date()
    const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth())
    const [selectedYear, setSelectedYear] = useState<number>(
        today.getFullYear(),
    )
    const [filtroAtivo, setFiltroAtivo] = useState(false)

    // -----------------------------
    // 1️⃣ FILTRAR EVENTOS POR MÊS/ANO
    // -----------------------------
    const filteredEvents = useMemo(() => {
        if (!filtroAtivo) return events // se filtro estiver desativado → mostra tudo
        return events.filter((event) => {
            const eventDate = new Date(event.dataInicio)
            return (
                eventDate.getMonth() === selectedMonth &&
                eventDate.getFullYear() === selectedYear
            )
        })
    }, [events, selectedMonth, selectedYear, filtroAtivo])

    // -----------------------------
    // 2️⃣ CARREGAR LEAFLET
    // -----------------------------
    useEffect(() => {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        link.crossOrigin = ''
        document.head.appendChild(link)

        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.crossOrigin = ''
        script.onload = () => setLeafletLoaded(true)
        document.head.appendChild(script)

        return () => {
            link.remove()
            script.remove()
        }
    }, [])

    // -----------------------------
    // 3️⃣ INICIALIZAR MAPA
    // -----------------------------
    useEffect(() => {
        if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return
        const L = (window as any).L
        if (!L) return

        const map = L.map(mapRef.current).setView([-15.7942, -47.8822], 4)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
        }).addTo(map)

        mapInstanceRef.current = map
        setTimeout(() => map.invalidateSize(), 100)

        return () => {
            map.remove()
            mapInstanceRef.current = null
        }
    }, [leafletLoaded])

    // -----------------------------
    // 4️⃣ ADICIONAR MARKERS
    // -----------------------------
    useEffect(() => {
        if (!mapInstanceRef.current || !leafletLoaded) return
        const L = (window as any).L
        if (!L) return

        markersRef.current.forEach((m) => m.remove())
        markersRef.current = []

        const eventsWithCoords = filteredEvents.filter(
            (event) =>
                event.LocalNome && event.LocalLatitude && event.LocalLongitude,
        )
        if (eventsWithCoords.length === 0) return

        const createCustomIcon = (color: string) =>
            L.divIcon({
                html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                className: 'custom-marker',
                iconSize: [32, 32],
                iconAnchor: [16, 32],
                popupAnchor: [0, -32],
            })

        eventsWithCoords.forEach((event) => {
            // const local = event.local
            const color = event.categoria?.cor?.includes('bg-')
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

            const marker = L.marker(
                [event.LocalLatitude, event.LocalLongitude],
                {
                    icon: createCustomIcon(color),
                },
            ).addTo(mapInstanceRef.current)

            marker.on('click', () => setSelectedMarkerEvent(event))
            markersRef.current.push(marker)
        })

        if (eventsWithCoords.length > 0) {
            const bounds = L.latLngBounds(
                eventsWithCoords.map((event) => [
                    event.LocalLatitude,
                    event.LocalLongitude,
                ]),
            )
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] })
        }
    }, [filteredEvents, leafletLoaded])

    // -----------------------------
    // 5️⃣ ÍCONES E UI
    // -----------------------------
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

    const monthOptions = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
    ]
    const yearOptions = Array.from(
        { length: 7 },
        (_, i) => today.getFullYear() - 3 + i,
    )

    return (
        <div className="relative">
            {/* Header com filtro */}
            <div className="flex items-center justify-end mb-3 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    {/* <Filter className="w-5 h-5 text-primary" /> */}
                    {/* <h2 className="text-lg">Filtro de Mês/Ano</h2> */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="ativar-filtro"
                            checked={filtroAtivo}
                            onCheckedChange={(checked) =>
                                setFiltroAtivo(!!checked)
                            }
                        />
                        <label
                            htmlFor="ativar-filtro"
                            className="text-sm cursor-pointer"
                        >
                            Filtrar por mês e ano
                        </label>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Select
                        onValueChange={(val) => setSelectedMonth(Number(val))}
                        value={String(selectedMonth)}
                    >
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Mês" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map((m, i) => (
                                <SelectItem key={m} value={String(i)}>
                                    {m}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        onValueChange={(val) => setSelectedYear(Number(val))}
                        value={String(selectedYear)}
                    >
                        <SelectTrigger className="w-[100px]">
                            <SelectValue placeholder="Ano" />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* MAPA */}
            <div className="relative h-[calc(100vh-400px)] min-h-[500px] rounded-lg overflow-hidden border border-border shadow-lg">
                <div ref={mapRef} className="w-full h-full z-0" />

                {/* CARD DO EVENTO SELECIONADO */}
                {selectedMarkerEvent && (
                    <Card className="absolute top-4 right-4 w-80 shadow-2xl z-[1000] max-h-[calc(100%-2rem)] overflow-auto">
                        <CardHeader className="relative pb-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-8 w-8 p-0"
                                onClick={() => setSelectedMarkerEvent(null)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <CardTitle className="pr-8">
                                {selectedMarkerEvent.titulo}
                            </CardTitle>
                            <div className="flex gap-2">
                                {selectedMarkerEvent.categoria && (
                                    <Badge
                                        className={`${
                                            selectedMarkerEvent.categoria.cor ||
                                            'bg-slate-600'
                                        } text-white border-0 w-fit`}
                                    >
                                        {selectedMarkerEvent.categoria.nome}
                                    </Badge>
                                )}
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
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        {new Date(
                                            selectedMarkerEvent.dataInicio,
                                        ).toLocaleDateString('pt-BR', {
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
                                        {selectedMarkerEvent.horarioAbertura?.substring(
                                            11,
                                            16,
                                        )}{' '}
                                        -{' '}
                                        {selectedMarkerEvent.horarioEncerramento?.substring(
                                            11,
                                            16,
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span>
                                        {selectedMarkerEvent.capacidadeMaxima}{' '}
                                        pessoas
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    {getTipoEventoIcon(
                                        selectedMarkerEvent.tipoEvento,
                                    )}
                                    <span className="capitalize">
                                        {selectedMarkerEvent.tipoEvento}
                                    </span>
                                </div>
                            </div>
                            <Button
                                onClick={() =>
                                    onEventClick(selectedMarkerEvent)
                                }
                                className="w-full"
                            >
                                Ver Detalhes Completos
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* CARD DE INFORMAÇÕES */}
                <Card className="absolute bottom-4 left-4 shadow-xl z-[1000]">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <p className="text-sm">
                                {
                                    filteredEvents.filter(
                                        (e) =>
                                            e.LocalNome &&
                                            e.LocalLatitude &&
                                            e.LocalLongitude,
                                    ).length
                                }{' '}
                                eventos no mapa
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
