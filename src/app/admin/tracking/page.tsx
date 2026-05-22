'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, MapPin, Bike, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Langkawi, Malaysia - primary tourist motorcycle rental area
const DEFAULT_CENTER = { lat: 6.3500, lng: 99.8000 }
const GEOFENCE_RADIUS_KM = 30

// Mock active rentals with GPS coords scattered around Langkawi
const MOCK_RENTALS = [
  { id: '1', plate: 'PDL 1234', model: 'Honda PCX 150', guest: 'John Smith', lat: 6.3452, lng: 99.7983, inZone: true },
  { id: '2', plate: 'PDL 5678', model: 'Yamaha NMax', guest: 'Sarah Lee', lat: 6.3601, lng: 99.8124, inZone: true },
  { id: '3', plate: 'PDL 9012', model: 'Honda Beat', guest: 'Tan Wei Ming', lat: 6.4012, lng: 99.8456, inZone: true },
  { id: '4', plate: 'PDL 3456', model: 'Yamaha Aerox', guest: 'Emma Wilson', lat: 6.2234, lng: 99.6789, inZone: false },
  { id: '5', plate: 'PDL 7890', model: 'Honda Vario', guest: 'Ali Hassan', lat: 6.5023, lng: 100.1234, inZone: false },
]

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any
    initMap?: () => void
  }
}

export default function TrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [activeRentals, setActiveRentals] = useState<typeof MOCK_RENTALS>([])
  const [loading, setLoading] = useState(true)
  const [selectedRental, setSelectedRental] = useState<(typeof MOCK_RENTALS)[0] | null>(null)
  const [geofenceRadius, setGeofenceRadius] = useState(GEOFENCE_RADIUS_KM)
  const circleRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  // Load active rentals (mock + real structure)
  useEffect(() => {
    async function loadActiveRentals() {
      setLoading(true)
      // In production: fetch motorcycles with active bookings + their GPS coords
      // For now use mock data
      await new Promise((r) => setTimeout(r, 600))
      setActiveRentals(MOCK_RENTALS)
      setLoading(false)
    }
    loadActiveRentals()
  }, [])

  // Load Google Maps script
  useEffect(() => {
    if (!MAPS_KEY) return
    if (window.google?.maps) { setMapsLoaded(true); return }
    const existing = document.getElementById('gmap-script')
    if (existing) return

    const script = document.createElement('script')
    script.id = 'gmap-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`
    script.async = true
    script.onload = () => setMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Init map
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 11,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A3565' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#132A4D' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
      ],
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: false,
    })
    mapInstanceRef.current = map

    // Draw geofence circle
    circleRef.current = new window.google.maps.Circle({
      map,
      center: DEFAULT_CENTER,
      radius: geofenceRadius * 1000,
      strokeColor: '#FF6A00',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      fillColor: '#FF6A00',
      fillOpacity: 0.06,
    })

    // Add markers
    MOCK_RENTALS.forEach((r) => {
      const marker = new window.google.maps.Marker({
        map,
        position: { lat: r.lat, lng: r.lng },
        title: `${r.plate} — ${r.guest}`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: r.inZone ? '#22C55E' : '#EF4444',
          fillOpacity: 1,
          strokeColor: r.inZone ? '#16a34a' : '#b91c1c',
          strokeWeight: 2,
        },
        label: {
          text: r.plate.split(' ')[1] ?? r.plate,
          color: '#F5F7FA',
          fontSize: '9px',
          fontWeight: 'bold',
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="background:#132A4D;color:#F5F7FA;padding:8px 12px;border-radius:8px;font-family:system-ui;font-size:13px;min-width:140px">
          <div style="font-weight:600;color:#FF9B4D">${r.plate}</div>
          <div style="color:#94A3B8;font-size:11px;margin-top:2px">${r.model}</div>
          <div style="margin-top:4px">${r.guest}</div>
          <div style="margin-top:4px;font-size:11px;color:${r.inZone ? '#22C55E' : '#EF4444'}">${r.inZone ? '✓ In zone' : '⚠ Outside zone'}</div>
        </div>`,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        setSelectedRental(r)
      })
      markersRef.current.push(marker)
    })
  }, [mapsLoaded, geofenceRadius])

  const outOfZone = activeRentals.filter((r) => !r.inZone)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5F7FA]">Live Tracking</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
            {loading ? 'Loading…' : `${activeRentals.length} active rentals`}
          </span>
          <Button
            size="sm"
            onClick={() => window.location.reload()}
            className="bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10 gap-1.5"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      {outOfZone.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="size-4 text-red-400" />
            <span className="text-sm font-semibold text-red-400">
              {outOfZone.length} motorcycle{outOfZone.length > 1 ? 's' : ''} outside geofence zone
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {outOfZone.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <span className="font-mono font-semibold text-[#F5F7FA]">{r.plate}</span>
                  <span className="text-[#94A3B8] ml-2">{r.model}</span>
                </div>
                <span className="text-[#94A3B8] text-xs">{r.guest}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-white/8" style={{ height: 520 }}>
          {!MAPS_KEY ? (
            <div className="size-full bg-[#132A4D] flex items-center justify-center flex-col gap-3 text-[#94A3B8]">
              <MapPin className="size-10 text-[#FF6A00]" />
              <p className="font-medium text-[#F5F7FA]">Google Maps API key not configured</p>
              <p className="text-sm">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
            </div>
          ) : !mapsLoaded ? (
            <div className="size-full bg-[#132A4D] flex items-center justify-center text-[#94A3B8]">
              Loading map…
            </div>
          ) : (
            <div ref={mapRef} className="size-full" />
          )}
        </div>

        {/* Sidebar panel */}
        <div className="flex flex-col gap-3">
          {/* Geofence settings */}
          <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="size-4 text-[#FF6A00]" />
              <span className="text-sm font-semibold text-[#F5F7FA]">Geofence Zone</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#94A3B8]">Radius (km)</label>
              <input
                type="range"
                min={5}
                max={100}
                value={geofenceRadius}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setGeofenceRadius(v)
                  if (circleRef.current) circleRef.current.setRadius(v * 1000)
                }}
                className="accent-[#FF6A00] w-full"
              />
              <div className="flex justify-between text-xs text-[#94A3B8]">
                <span>5 km</span>
                <span className="text-[#FF9B4D] font-semibold">{geofenceRadius} km</span>
                <span>100 km</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-white/8">
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <div className="size-2.5 rounded-full bg-[#22C55E]" />
                <span>In zone</span>
                <div className="size-2.5 rounded-full bg-red-500 ml-2" />
                <span>Out of zone</span>
              </div>
            </div>
          </div>

          {/* Active rentals list */}
          <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Bike className="size-4 text-[#FF6A00]" />
              <span className="text-sm font-semibold text-[#F5F7FA]">Active Rentals</span>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {activeRentals.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRental(r)
                      if (mapInstanceRef.current) {
                        mapInstanceRef.current.panTo({ lat: r.lat, lng: r.lng })
                        mapInstanceRef.current.setZoom(14)
                      }
                    }}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedRental?.id === r.id
                        ? 'bg-[#FF6A00]/15 border-[#FF6A00]/30'
                        : 'bg-white/3 border-white/5 hover:bg-white/8'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-[#FF9B4D]">{r.plate}</span>
                      <div className={`size-2 rounded-full ${r.inZone ? 'bg-green-400' : 'bg-red-400'}`} />
                    </div>
                    <div className="text-xs text-[#94A3B8] mt-0.5 truncate">{r.guest}</div>
                    <div className="text-xs text-[#94A3B8] truncate">{r.model}</div>
                  </button>
                ))}
                {activeRentals.length === 0 && (
                  <p className="text-sm text-[#94A3B8] text-center py-4">No active rentals</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4">
        <p className="text-xs text-[#94A3B8]">
          <span className="text-[#FF9B4D] font-medium">Note:</span> This map currently displays demo data.
          Real-time GPS tracking requires a GPS module installed on each motorcycle transmitting coordinates
          to the <code className="bg-white/5 px-1 rounded text-[#F5F7FA]">motorcycles</code> table
          (<code className="bg-white/5 px-1 rounded text-[#F5F7FA]">last_lat</code>, <code className="bg-white/5 px-1 rounded text-[#F5F7FA]">last_lng</code>, <code className="bg-white/5 px-1 rounded text-[#F5F7FA]">last_seen_at</code> columns).
        </p>
      </div>
    </div>
  )
}
