import { useState, useEffect } from 'react'

export type GeoStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'

export interface GeoPosition {
  lat: number
  lon: number
}

export function useGeolocation() {
  const [status, setStatus] = useState<GeoStatus>('idle')
  const [position, setPosition] = useState<GeoPosition | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('unavailable')
      return
    }

    setStatus('requesting')

    const id = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus('granted')
      },
      () => {
        setStatus('denied')
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )

    return () => {
      if (typeof id === 'number') navigator.geolocation.clearWatch(id)
    }
  }, [])

  const retry = () => {
    if (!navigator.geolocation) return
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus('granted')
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
    )
  }

  return { status, position, retry }
}
