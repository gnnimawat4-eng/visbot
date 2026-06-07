'use client'
import { useEffect, useState } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Orientation = 'portrait' | 'landscape'

export interface DeviceInfo {
  type: DeviceType
  orientation: Orientation
  isTouch: boolean
  width: number
  height: number
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other'
}

// Matches md: (768) and lg: (1024) Tailwind defaults
const MOBILE_MAX = 767
const TABLET_MAX = 1023

export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return { type: 'desktop', orientation: 'landscape', isTouch: false, width: 1440, height: 900, os: 'other' }
  }

  const width  = window.innerWidth
  const height = window.innerHeight
  const ua     = navigator.userAgent.toLowerCase()

  let type: DeviceType = 'desktop'
  if (width <= MOBILE_MAX)      type = 'mobile'
  else if (width <= TABLET_MAX) type = 'tablet'

  const orientation: Orientation = width > height ? 'landscape' : 'portrait'
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  let os: DeviceInfo['os'] = 'other'
  if (/iphone|ipad|ipod/.test(ua))  os = 'ios'
  else if (/android/.test(ua))       os = 'android'
  else if (/windows/.test(ua))       os = 'windows'
  else if (/mac/.test(ua))           os = 'macos'
  else if (/linux/.test(ua))         os = 'linux'

  return { type, orientation, isTouch, width, height, os }
}

export function useDevice(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>(() => detectDevice())

  useEffect(() => {
    const update = () => setDevice(detectDevice())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return device
}

export function useIsMobile()  { return useDevice().type === 'mobile'  }
export function useIsTablet()  { return useDevice().type === 'tablet'  }
export function useIsDesktop() { return useDevice().type === 'desktop' }
export function useIsTouch()   { return useDevice().isTouch }
