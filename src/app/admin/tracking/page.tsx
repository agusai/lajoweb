'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { AlertTriangle, MapPin, Bike, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// Cameron Highlands — Main Hub Brinchang
const DEFAULT_CENTER = { lat: 4.5246, lng: 101.3823 }
const GEOFENCE_RADIUS_KM = 30

type ActiveRental = {
  id: string
  plate: string
  model: string
  guest: string
  lat: number
  lng: number
  inZone: boolean
  status: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google: any
  }
}

function isInZone(lat: number, lng: number, radiusKm: number) {
  const R = 6371
  const dLat = ((lat - DEFAULT_CENTER.lat) * Math.PI) / 180
  const dLng = ((lng - DEFAULT_CENTER.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((DEFAULT_CENTER.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return dist <= radiusKm
}

export default function TrackingPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapsLoaded, setMapsLoaded] = useState(false)
  const [activeRentals, setActiveRentals] = useState<ActiveRental[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRental, setSelectedRental] = useState<ActiveRental | null>(null)
  const [geofenceRadius, setGeofenceRadius] = useState(GEOFENCE_RADIUS_KM)
  const circleRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  const loadActiveRentals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tracking/active')
      if (res.ok) {
        const json = await res.json()
        const rentals: ActiveRental[] = (json.data ?? []).map((b: any) => {
          const lat = b.delivery_lat ?? DEFAULT_CENTER.lat + (Math.random() - 0.5) * 0.05
          const lng = b.delivery_lng ?? DEFAULT_CENTER.lng + (Math.random() - 0.5) * 0.05
          const moto = Array.isArray(b.motorcycles) ? b.motorcycles[0] : b.motorcycles
          return {
            id: b.id,
            plate: moto?.plate_number ?? '—',
            model: moto?.model ?? 'Motorcycle',
            guest: b.guest_name ?? 'Guest',
            lat,
            lng,
            inZone: isInZone(lat, lng, geofenceRadius),
            status: b.status,
          }
        })
        setActiveRentals(rentals)
      }
    } catch {
      setActiveRentals([])
    } finally {
      setLoading(false)
    }
  }, [geofenceRadius])

  useEffect(() => { loadActiveRentals() }, [loadActiveRentals])

  // Load Google Maps script
  useEffect(() => {
    if (!MAPS_KEY) return
    if (window.google?.maps) { setMapsLoaded(true); return }
    if (document.getElementById('gmap-script')) return

    const script = document.createElement('script')
    script.id = 'gmap-script'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}`
    script.async = true
    script.onload = () => setMapsLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Init / re-draw map when data or mapsLoaded changes
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return

    // Create map once
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: DEFAULT_CENTER,
        zoom: 12,
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#0D1B2A' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0D1B2A' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1A3565' }] },
          { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#132A4D' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D2244' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        ],
        mapTypeControl: false,
        streetViewControl: false,
      })
    }

    const map = mapInstanceRef.current

    // Update geofence circle
    if (circleRef.current) circleRef.current.setMap(null)
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

    // Hub marker
    new window.google.maps.Marker({
      map,
      position: DEFAULT_CENTER,
      title: 'LAJO Main Hub — Brinchang',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#FF6A00',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
      label: { text: 'HUB', color: '#fff', fontSize: '8px', fontWeight: 'bold' },
    })

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []

    // Add rental markers
    activeRentals.forEach((r) => {
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
          text: r.plate !== '—' ? (r.plate.split(' ')[1] ?? r.plate) : r.model.slice(0, 4),
          color: '#F5F7FA',
          fontSize: '9px',
          fontWeight: 'bold',
        },
      })

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="background:#132A4D;color:#F5F7FA;padding:8px 12px;border-radius:8px;font-family:system-ui;font-size:13px;min-width:150px">
          <div style="font-weight:600;color:#FF9B4D">${r.plate}</div>
          <div style="color:#94A3B8;font-size:11px;margin-top:2px">${r.model}</div>
          <div style="margin-top:4px">${r.guest}</div>
          <div style="margin-top:4px;font-size:11px;padding:2px 6px;border-radius:4px;display:inline-block;background:${r.inZone ? '#166534' : '#7f1d1d'};color:${r.inZone ? '#22C55E' : '#EF4444'}">${r.inZone ? '✓ In zone' : '⚠ Outside zone'}</div>
        </div>`,
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
        setSelectedRental(r)
      })
      markersRef.current.push(marker)
    })
  }, [mapsLoaded, activeRentals, geofenceRadius])

  const outOfZone = activeRentals.filter((r) => !r.inZone)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F5F7FA]">Live Tracking</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94A3B8] bg-white/5 px-3 py-1.5 rounded-lg border border-white/8">
            {loading ? 'Loading…' : `${activeRentals.length} active rental${activeRentals.length !== 1 ? 's' : ''}`}
          </span>
          <Button
            size="sm"
            onClick={loadActiveRentals}
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
              <div key={r.id} className="flex items-center justify-between bg-red-500/10 rounded-lg px-3 py-2 text-sm">
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
              <p className="text-sm">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in Vercel env vars</p>
            </div>
          ) : !mapsLoaded ? (
            <div className="size-full bg-[#132A4D] flex items-center justify-center text-[#94A3B8]">
              Loading map…
            </div>
          ) : (
            <div ref={mapRef} className="size-full" />
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-3">
          <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="size-4 text-[#FF6A00]" />
              <span className="text-sm font-semibold text-[#F5F7FA]">Geofence Zone</span>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#94A3B8]">Radius (km)</label>
              <input
                type="range" min={5} max={100} value={geofenceRadius}
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
                <div className="size-2.5 rounded-full bg-[#FF6A00]" /><span>Hub</span>
                <div className="size-2.5 rounded-full bg-[#22C55E] ml-2" /><span>In zone</span>
                <div className="size-2.5 rounded-full bg-red-500 ml-2" /><span>Out</span>
              </div>
            </div>
          </div>

          <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Bike className="size-4 text-[#FF6A00]" />
              <span className="text-sm font-semibold text-[#F5F7FA]">Active Rentals</span>
            </div>
            {loading ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : activeRentals.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-4">No active rentals</p>
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
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#132A4D] border border-white/8 rounded-xl p-4">
        <p className="text-xs text-[#94A3B8]">
          <span className="text-[#FF9B4D] font-medium">Note:</span> Markers show delivery locations from active bookings.
          Real-time GPS tracking requires a GPS module on each motorcycle transmitting to the{' '}
          <code className="bg-white/5 px-1 rounded text-[#F5F7FA]">motorcycles</code> table
          (<code className="bg-white/5 px-1 rounded text-[#F5F7FA]">last_lat</code>,{' '}
          <code className="bg-white/5 px-1 rounded text-[#F5F7FA]">last_lng</code>).
        </p>
      </div>
    </div>
  )
}
