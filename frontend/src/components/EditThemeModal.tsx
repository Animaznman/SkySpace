'use client'

import { useState, useEffect, useRef } from 'react'
import { useTheme, ThemeConfig } from '@/contexts/ThemeContext'
import { Page } from '@/lib/bigquery'

interface EditThemeModalProps {
  isOpen: boolean
  onClose: () => void
  pageData: Page
  did: string
  onSave: (updatedPage: Page) => void
  previewContent?: React.ReactNode
}

export function EditThemeModal({ isOpen, onClose, pageData, did, onSave, previewContent }: EditThemeModalProps) {
  const { theme, setTheme } = useTheme()
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedTheme, setGeneratedTheme] = useState<ThemeConfig | null>(null)
  const [saving, setSaving] = useState(false)
  const originalTheme = useRef<ThemeConfig | null>(null)

  // Store original theme when modal opens
  useEffect(() => {
    if (isOpen && !originalTheme.current) {
      originalTheme.current = theme
    } else if (!isOpen) {
      originalTheme.current = null
    }
  }, [isOpen, theme])

  // Custom close handler to restore original theme if not saved
  const handleClose = () => {
    if (originalTheme.current && !saving) {
      setTheme(originalTheme.current)
    }
    setGeneratedTheme(null)
    setPrompt('')
    onClose()
  }

  const handleGenerateTheme = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setGenerating(true)
    try {
      const response = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          currentTheme: theme
        })
      })

      if (response.ok) {
        const data = await response.json()
        setGeneratedTheme(data.theme)
        setTheme(data.theme) // Apply theme immediately for live preview
      } else {
        throw new Error('Failed to generate theme')
      }
    } catch (error) {
      console.error('Theme generation failed:', error)
      alert('Failed to generate theme. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleApplyTheme = async () => {
    if (!generatedTheme) return

    setSaving(true)
    try {
      const response = await fetch(`/api/pages/${did}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: pageData.page_id,
          current_theme: generatedTheme,
          previous_theme: pageData.current_theme
        })
      })

      if (response.ok) {
        const updatedPage = await response.json()
        setTheme(generatedTheme)
        onSave(updatedPage)
        originalTheme.current = generatedTheme // Update original theme reference
        handleClose()
      } else {
        throw new Error('Failed to save theme')
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
      alert('Failed to apply theme. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const examplePrompts = [
    "Dark mode with purple accents and glitter effects",
    "Ocean theme with blue colors and large fonts",
    "Retro MySpace with bright colors and Comic Sans font",
    "Minimalist design with centered layout and no animations",
    "Forest theme with green colors and serif fonts",
    "Sunset theme with orange and pink gradients",
    "Professional theme with clean layout and monospace fonts",
    "Playful theme with rainbow colors and fun animations"
  ]

  if (!isOpen) return null

  return (
    <div className="live-editor-container">
      <div className="live-editor-sidebar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2>AI Theme Generator</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            style={{ padding: '1.5rem', margin: '-1.5rem' }}
          >
            ×
          </button>
        </div>
        
        <div className="form-content">
          <form onSubmit={handleGenerateTheme} className="space-y-6">
            {/* Theme Description Section */}
            <div className="form-section">
              <h3>✨ Describe Your Theme</h3>
              <div className="form-group">
                <label className="layout-label">Theme Description:</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the colors, layout, fonts, and effects you want for your profile..."
                  rows={4}
                  className="text-input"
                  disabled={generating}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                />
              </div>

              <button
                type="submit"
                className="save-button w-full"
                disabled={generating || !prompt.trim()}
                style={{
                  background: generating 
                    ? 'linear-gradient(135deg, #6b7280, #9ca3af)'
                    : 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                  marginTop: '1rem'
                }}
              >
                {generating ? 'Generating Theme...' : '🪄 Generate Theme with AI'}
              </button>
            </div>

            {/* Example Prompts Section */}
            <div className="form-section">
              <h3>💡 Example Prompts</h3>
              <div className="space-y-2">
                {examplePrompts.map((example, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="example-prompt-btn"
                    disabled={generating}
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>

            {/* Generated Theme Preview */}
            {generatedTheme && (
              <div className="form-section">
                <h3>🎨 Generated Theme</h3>
                
                {/* Color Preview */}
                <div className="color-input-group">
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', fontWeight: '600' }}>Colors:</h4>
                  {Object.entries(generatedTheme.colors).map(([key, value]) => (
                    <div key={key} className="color-row">
                      <div
                        className="color-preview"
                        style={{ backgroundColor: value }}
                      ></div>
                      <div className="color-info">
                        <div className="color-label">{key}</div>
                        <div className="color-value" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                          {value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Layout & Settings Preview */}
                <div className="layout-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="layout-item">
                    <label className="layout-label">Profile Position:</label>
                    <div className="select-preview">{generatedTheme.layout.profilePosition}</div>
                  </div>
                  <div className="layout-item">
                    <label className="layout-label">Music Player:</label>
                    <div className="select-preview">{generatedTheme.layout.musicPlayer}</div>
                  </div>
                  <div className="layout-item">
                    <label className="layout-label">Friends List:</label>
                    <div className="select-preview">{generatedTheme.layout.friendsList}</div>
                  </div>
                  <div className="layout-item">
                    <label className="layout-label">Content Width:</label>
                    <div className="select-preview">{generatedTheme.layout.contentWidth}</div>
                  </div>
                </div>

                {/* Fonts & Effects */}
                <div className="font-grid" style={{ marginTop: '1.5rem' }}>
                  <div className="form-group">
                    <label className="layout-label">Heading Font:</label>
                    <div className="select-preview">{generatedTheme.fonts.heading}</div>
                  </div>
                  <div className="form-group">
                    <label className="layout-label">Body Font:</label>
                    <div className="select-preview">{generatedTheme.fonts.body}</div>
                  </div>
                </div>

                <div className="checkbox-group" style={{ marginTop: '1.5rem' }}>
                  <div className="checkbox-item">
                    <span className="checkbox-preview">{generatedTheme.customization.animations ? '✓' : '✗'}</span>
                    Animations
                  </div>
                  <div className="checkbox-item">
                    <span className="checkbox-preview">{generatedTheme.customization.glitter ? '✓' : '✗'}</span>
                    Glitter Effect
                  </div>
                </div>

                {/* Theme JSON (expandable) */}
                <details style={{ marginTop: '1.5rem' }}>
                  <summary className="cursor-pointer font-medium" style={{ color: 'var(--theme-primary)', marginBottom: '0.5rem' }}>
                    View Generated JSON
                  </summary>
                  <pre className="json-preview">
                    {JSON.stringify(generatedTheme, null, 2)}
                  </pre>
                </details>
              </div>
            )}

            {/* Instructions */}
            <div className="form-section">
              <div className="info-box">
                <p><strong>How it works:</strong> Describe your ideal theme in natural language. The AI will generate a complete theme configuration including colors, fonts, layout, and effects. You can then preview and apply the theme to your profile.</p>
              </div>
            </div>
          </form>
        </div>
        
        {/* Action Buttons */}
        <div className="button-group">
          {generatedTheme && (
            <button
              type="button"
              onClick={() => setGeneratedTheme(null)}
              className="cancel-button"
              disabled={saving}
            >
              Discard
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="cancel-button"
            disabled={generating || saving}
          >
            Close
          </button>
          {generatedTheme && (
            <button
              type="button"
              onClick={handleApplyTheme}
              className="save-button"
              disabled={saving}
              style={saving ? {
                background: 'linear-gradient(135deg, #059669, #10b981)',
              } : {}}
            >
              {saving ? 'Applying Theme...' : '✓ Apply This Theme'}
            </button>
          )}
        </div>
      </div>
      
      <div className="live-editor-preview">
        <div className="preview-header">
          <h3>Live Preview</h3>
          <div className="preview-controls">
            <button onClick={handleClose} className="close-preview-btn">
              ← Close Generator
            </button>
          </div>
        </div>
        <div className="preview-content" key={JSON.stringify(theme?.colors || {})}>
          {previewContent}
        </div>
      </div>
    </div>
  )
}