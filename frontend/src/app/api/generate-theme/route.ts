import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, currentTheme } = body

    if (!prompt) {
      return NextResponse.json(
        { error: 'Theme description prompt is required' },
        { status: 400 }
      )
    }

    // Check if Gemini API key is available
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.warn('Gemini API key not found, falling back to keyword-based generation')
      const theme = generateThemeFromPrompt(prompt, currentTheme)
      return NextResponse.json({ theme })
    }

    // Use Gemini AI to generate theme
    try {
      const theme = await generateThemeWithGemini(prompt, currentTheme, apiKey)
      return NextResponse.json({ theme })
    } catch (geminiError) {
      console.error('Gemini API error, falling back to keyword generation:', geminiError)
      const theme = generateThemeFromPrompt(prompt, currentTheme)
      return NextResponse.json({ theme })
    }
  } catch (error) {
    console.error('Theme generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate theme' },
      { status: 500 }
    )
  }
}

async function generateThemeWithGemini(prompt: string, currentTheme: any, apiKey: string) {
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const systemPrompt = `You are a MySpace-style theme generator. Convert user descriptions into JSON theme configurations.

IMPORTANT: Return ONLY a valid JSON object, no additional text or markdown formatting.

Theme structure:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex",
    "background": "#hex",
    "text": "#hex",
    "border": "#hex"
  },
  "fonts": {
    "heading": "font-family",
    "body": "font-family",
    "size": {
      "small": "px",
      "medium": "px", 
      "large": "px"
    }
  },
  "layout": {
    "profilePosition": "left|right|center",
    "musicPlayer": "top|bottom|sidebar",
    "friendsList": "left|right|hidden",
    "contentWidth": "px"
  },
  "customization": {
    "backgroundImage": "url or null",
    "profileMusic": "url or null", 
    "animations": boolean,
    "glitter": boolean
  }
}

Font options: "Arial, sans-serif", "Georgia, serif", "Times New Roman, serif", "Comic Sans MS, cursive", "Monaco, monospace", "Courier New, monospace", "Helvetica, sans-serif"
Width options: "600px", "800px", "1000px", "1200px"`

  const userPrompt = `Current theme: ${JSON.stringify(currentTheme, null, 2)}

User request: "${prompt}"

Generate a theme that matches this description. Modify the current theme based on the user's request.`

  const result = await model.generateContent([
    { text: systemPrompt },
    { text: userPrompt }
  ])

  const responseText = result.response.text().trim()
  
  // Clean up the response to ensure it's valid JSON
  const cleanedResponse = responseText
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*```[\s\S]*?```\s*$/gm, '')
    .trim()

  try {
    const theme = JSON.parse(cleanedResponse)
    
    // Validate theme structure and provide defaults if needed
    return validateAndFixTheme(theme, currentTheme)
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', parseError, 'Response:', cleanedResponse)
    throw new Error('Invalid JSON response from AI')
  }
}

function validateAndFixTheme(theme: any, fallbackTheme: any) {
  const defaultTheme = {
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

  // Merge with defaults, then fallback theme, then AI theme
  return {
    colors: { ...defaultTheme.colors, ...fallbackTheme?.colors, ...theme?.colors },
    fonts: { 
      ...defaultTheme.fonts, 
      ...fallbackTheme?.fonts, 
      ...theme?.fonts,
      size: { 
        ...defaultTheme.fonts.size, 
        ...fallbackTheme?.fonts?.size, 
        ...theme?.fonts?.size 
      }
    },
    layout: { ...defaultTheme.layout, ...fallbackTheme?.layout, ...theme?.layout },
    customization: { ...defaultTheme.customization, ...fallbackTheme?.customization, ...theme?.customization }
  }
}

function generateThemeFromPrompt(prompt: string, currentTheme: any) {
  const lowerPrompt = prompt.toLowerCase()
  
  // Base theme structure - dark theme by default
  let theme = {
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
      profilePosition: 'left' as const,
      musicPlayer: 'bottom' as const,
      friendsList: 'right' as const,
      contentWidth: '800px'
    },
    customization: {
      backgroundImage: null,
      profileMusic: null,
      animations: true,
      glitter: false
    }
  }

  // Merge with current theme if provided
  if (currentTheme) {
    theme = {
      colors: { ...theme.colors, ...currentTheme.colors },
      fonts: { 
        ...theme.fonts, 
        ...currentTheme.fonts,
        size: { ...theme.fonts.size, ...currentTheme.fonts?.size }
      },
      layout: { ...theme.layout, ...currentTheme.layout },
      customization: { ...theme.customization, ...currentTheme.customization }
    }
  }

  // Color scheme detection
  if (lowerPrompt.includes('light') || lowerPrompt.includes('bright') || lowerPrompt.includes('white')) {
    theme.colors = {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#60a5fa',
      background: '#ffffff',
      text: '#1f2937',
      border: '#e5e7eb'
    }
  } else if (lowerPrompt.includes('dark') || lowerPrompt.includes('night') || lowerPrompt.includes('black')) {
    theme.colors = {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#a855f7',
      background: '#111827',
      text: '#f9fafb',
      border: '#374151'
    }
  } else if (lowerPrompt.includes('sunset') || lowerPrompt.includes('orange') || lowerPrompt.includes('warm')) {
    theme.colors = {
      primary: '#f59e0b',
      secondary: '#f97316',
      accent: '#ef4444',
      background: '#fef3c7',
      text: '#92400e',
      border: '#fcd34d'
    }
  } else if (lowerPrompt.includes('ocean') || lowerPrompt.includes('blue') || lowerPrompt.includes('water')) {
    theme.colors = {
      primary: '#0891b2',
      secondary: '#06b6d4',
      accent: '#22d3ee',
      background: '#f0f9ff',
      text: '#0c4a6e',
      border: '#7dd3fc'
    }
  } else if (lowerPrompt.includes('forest') || lowerPrompt.includes('green') || lowerPrompt.includes('nature')) {
    theme.colors = {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#f0fdf4',
      text: '#064e3b',
      border: '#86efac'
    }
  } else if (lowerPrompt.includes('pink') || lowerPrompt.includes('rose') || lowerPrompt.includes('romantic')) {
    theme.colors = {
      primary: '#e11d48',
      secondary: '#f43f5e',
      accent: '#fb7185',
      background: '#fdf2f8',
      text: '#881337',
      border: '#fbb6ce'
    }
  } else if (lowerPrompt.includes('purple') || lowerPrompt.includes('violet') || lowerPrompt.includes('magic')) {
    theme.colors = {
      primary: '#7c3aed',
      secondary: '#8b5cf6',
      accent: '#a78bfa',
      background: '#faf5ff',
      text: '#581c87',
      border: '#c4b5fd'
    }
  }

  // Layout detection
  if (lowerPrompt.includes('center') || lowerPrompt.includes('middle')) {
    theme.layout.profilePosition = 'center'
  } else if (lowerPrompt.includes('right')) {
    theme.layout.profilePosition = 'right'
  }

  if (lowerPrompt.includes('music top') || lowerPrompt.includes('player top')) {
    theme.layout.musicPlayer = 'top'
  }

  if (lowerPrompt.includes('hide friends') || lowerPrompt.includes('no friends')) {
    theme.layout.friendsList = 'hidden'
  }

  // Font detection
  if (lowerPrompt.includes('serif') || lowerPrompt.includes('elegant') || lowerPrompt.includes('classic')) {
    theme.fonts.heading = 'Georgia, serif'
    theme.fonts.body = 'Georgia, serif'
  } else if (lowerPrompt.includes('mono') || lowerPrompt.includes('code') || lowerPrompt.includes('tech')) {
    theme.fonts.heading = 'Monaco, monospace'
    theme.fonts.body = 'Monaco, monospace'
  } else if (lowerPrompt.includes('comic') || lowerPrompt.includes('fun') || lowerPrompt.includes('playful')) {
    theme.fonts.heading = 'Comic Sans MS, cursive'
    theme.fonts.body = 'Comic Sans MS, cursive'
  }

  // Size detection
  if (lowerPrompt.includes('large') || lowerPrompt.includes('big')) {
    theme.fonts.size = {
      small: '14px',
      medium: '16px',
      large: '22px'
    }
  } else if (lowerPrompt.includes('small') || lowerPrompt.includes('compact')) {
    theme.fonts.size = {
      small: '10px',
      medium: '12px',
      large: '16px'
    }
  }

  // Effects detection
  if (lowerPrompt.includes('glitter') || lowerPrompt.includes('sparkle') || lowerPrompt.includes('bling')) {
    theme.customization.glitter = true
  }

  if (lowerPrompt.includes('no animation') || lowerPrompt.includes('static')) {
    theme.customization.animations = false
  }

  // Width detection
  if (lowerPrompt.includes('wide') || lowerPrompt.includes('full width')) {
    theme.layout.contentWidth = '1200px'
  } else if (lowerPrompt.includes('narrow') || lowerPrompt.includes('compact')) {
    theme.layout.contentWidth = '600px'
  }

  return theme
}