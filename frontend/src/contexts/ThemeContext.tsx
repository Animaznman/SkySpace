'use client'

import React, { createContext, useContext, useEffect } from 'react'

export interface ThemeConfig {
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
    border: string
  }
  fonts: {
    heading: string
    body: string
    size: {
      small: string
      medium: string
      large: string
    }
  }
  layout: {
    profilePosition: 'left' | 'right' | 'center'
    musicPlayer: 'top' | 'bottom' | 'sidebar'
    friendsList: 'left' | 'right' | 'hidden'
    contentWidth: string
  }
  customization: {
    backgroundImage: string | null
    profileMusic: string | null
    animations: boolean
    glitter: boolean
  }
}

interface ThemeContextType {
  theme: ThemeConfig
  setTheme: (theme: ThemeConfig | any) => void
  applyTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#a855f7',
    background: '#111827',
    text: '#f9fafb',
    border: '#374151'
  },
  fonts: {
    heading: 'Arial, sans-serif',
    body: 'Helvetica, sans-serif',
    size: {
      small: '12px',
      medium: '14px',
      large: '18px'
    }
  },
  layout: {
    profilePosition: 'left',
    musicPlayer: 'bottom',
    friendsList: 'right',
    contentWidth: '800px'
  },
  customization: {
    backgroundImage: null,
    profileMusic: null,
    animations: true,
    glitter: false
  }
}

export function ThemeProvider({ 
  children, 
  theme: initialTheme 
}: { 
  children: React.ReactNode
  theme?: ThemeConfig | null 
}) {
  // Merge initial theme with default to ensure all properties exist
  const mergeWithDefault = (theme: any): ThemeConfig => {
    if (!theme) return defaultTheme
    
    return {
      colors: { ...defaultTheme.colors, ...theme.colors },
      fonts: { 
        ...defaultTheme.fonts, 
        ...theme.fonts,
        size: { ...defaultTheme.fonts.size, ...theme.fonts?.size }
      },
      layout: { ...defaultTheme.layout, ...theme.layout },
      customization: { ...defaultTheme.customization, ...theme.customization }
    }
  }

  const [theme, setThemeState] = React.useState<ThemeConfig>(
    mergeWithDefault(initialTheme)
  )

  const setTheme = (newTheme: ThemeConfig) => {
    setThemeState(mergeWithDefault(newTheme))
  }

  const applyTheme = () => {
    if (!theme) return

    const root = document.documentElement
    
    // Apply CSS custom properties for colors
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-background', theme.colors.background)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-border', theme.colors.border)
    
    // Apply font properties
    root.style.setProperty('--theme-font-heading', theme.fonts.heading)
    root.style.setProperty('--theme-font-body', theme.fonts.body)
    root.style.setProperty('--theme-font-size-small', theme.fonts.size.small)
    root.style.setProperty('--theme-font-size-medium', theme.fonts.size.medium)
    root.style.setProperty('--theme-font-size-large', theme.fonts.size.large)
    
    // Apply layout properties
    root.style.setProperty('--theme-content-width', theme.layout.contentWidth)
    
    // Apply background image if set
    if (theme.customization.backgroundImage) {
      document.body.style.backgroundImage = `url(${theme.customization.backgroundImage})`
      document.body.style.backgroundSize = 'cover'
      document.body.style.backgroundPosition = 'center'
      document.body.style.backgroundAttachment = 'fixed'
    } else {
      document.body.style.backgroundImage = ''
      document.body.style.backgroundColor = theme.colors.background
    }
    
    // Apply animations class
    document.body.classList.toggle('animations-enabled', theme.customization.animations)
    document.body.classList.toggle('glitter-enabled', theme.customization.glitter)
  }

  useEffect(() => {
    applyTheme()
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}