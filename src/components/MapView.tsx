import { useEffect, useRef, useState } from 'react';
import { MapPin, Calendar, Clock, Users, X } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  capacity: number;
  image?: string;
  lat?: number;
  lng?: number;
}

interface MapViewProps {
  events: Event[];
  onEventClick: (event: Event) => void;
}

export function MapView({ events, onEventClick }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedMarkerEvent, setSelectedMarkerEvent] = useState<Event | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet CSS and JS
  useEffect(() => {
    // Add Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
    link.crossOrigin = '';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);

    return () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    // Center of Brazil
    const map = L.map(mapRef.current).setView([-15.7942, -47.8822], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    // Fix map display issues
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [leafletLoaded]);

  // Add markers for events
  useEffect(() => {
    if (!mapInstanceRef.current || !leafletLoaded) return;

    const L = (window as any).L;
    if (!L) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter events with valid coordinates
    const eventsWithCoords = events.filter(event => event.lat && event.lng);

    if (eventsWithCoords.length === 0) return;

    // Category colors for markers
    const categoryStyles: Record<string, string> = {
      'Tecnologia': '#2563eb',
      'Negócios': '#334155',
      'Educação': '#4f46e5',
      'Entretenimento': '#9333ea',
      'Esportes': '#ea580c',
      'Cultura': '#0d9488',
      'Saúde': '#16a34a',
    };

    // Create custom icon function
    const createCustomIcon = (color: string) => {
      return L.divIcon({
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });
    };

    // Add markers
    eventsWithCoords.forEach(event => {
      const color = categoryStyles[event.category] || '#64748b';
      const marker = L.marker([event.lat!, event.lng!], {
        icon: createCustomIcon(color),
      }).addTo(mapInstanceRef.current);

      const popupContent = `
        <div style="min-width: 200px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${event.title}</h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">${event.description.substring(0, 80)}${event.description.length > 80 ? '...' : ''}</p>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px; font-size: 12px;">
            <span>📅</span>
            <span>${new Date(event.date).toLocaleDateString('pt-BR')}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px; font-size: 12px;">
            <span>🕐</span>
            <span>${event.time}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
            <span>📍</span>
            <span>${event.location}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      marker.on('click', () => {
        setSelectedMarkerEvent(event);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (eventsWithCoords.length > 0) {
      const bounds = L.latLngBounds(
        eventsWithCoords.map(event => [event.lat!, event.lng!])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [events, leafletLoaded]);

  const categoryStyles: Record<string, string> = {
    'Tecnologia': 'bg-blue-600',
    'Negócios': 'bg-slate-700',
    'Educação': 'bg-indigo-600',
    'Entretenimento': 'bg-purple-600',
    'Esportes': 'bg-orange-600',
    'Cultura': 'bg-teal-600',
    'Saúde': 'bg-green-600',
  };

  return (
    <div className="relative h-[calc(100vh-400px)] min-h-[500px] rounded-lg overflow-hidden border border-border shadow-lg">
      <div ref={mapRef} className="w-full h-full z-0" />
      
      {/* Event Details Card */}
      {selectedMarkerEvent && (
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
            <CardTitle className="pr-8">{selectedMarkerEvent.title}</CardTitle>
            <Badge className={`${categoryStyles[selectedMarkerEvent.category] || 'bg-slate-600'} text-white border-0 w-fit`}>
              {selectedMarkerEvent.category}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMarkerEvent.image && (
              <img 
                src={selectedMarkerEvent.image} 
                alt={selectedMarkerEvent.title}
                className="w-full h-40 object-cover rounded-md"
              />
            )}
            
            <p className="text-sm text-muted-foreground">
              {selectedMarkerEvent.description}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>{new Date(selectedMarkerEvent.date).toLocaleDateString('pt-BR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>{selectedMarkerEvent.time}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{selectedMarkerEvent.capacity} pessoas</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{selectedMarkerEvent.location}</span>
              </div>
            </div>
            
            <Button 
              onClick={() => onEventClick(selectedMarkerEvent)}
              className="w-full"
            >
              Ver Detalhes Completos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card className="absolute bottom-4 left-4 shadow-xl z-[1000]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm">
                {events.filter(e => e.lat && e.lng).length} eventos no mapa
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
