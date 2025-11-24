'use client'

import { useState, useEffect } from 'react'
import { useTheme, ThemeConfig } from '@/contexts/ThemeContext'
import { Page } from '@/lib/bigquery'
import dynamic from 'next/dynamic'

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
})

interface EditPageModalProps {
  isOpen: boolean
  onClose: () => void
  pageData: Page
  did: string
  onSave: (updatedPage: Page) => void
  previewContent?: React.ReactNode
}

export function EditPageModal({ isOpen, onClose, pageData, did, onSave, previewContent }: EditPageModalProps) {
  const { theme, setTheme } = useTheme()
  const [formData, setFormData] = useState<ThemeConfig>(theme)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'form' | 'json'>('form')
  const [jsonData, setJsonData] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(theme)
      setJsonData(JSON.stringify(theme, null, 2))
    }
  }, [isOpen, theme])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      // Get the theme data based on active tab
      let themeToSave = formData
      if (activeTab === 'json') {
        try {
          themeToSave = JSON.parse(jsonData)
        } catch (error) {
          alert('Invalid JSON format. Please fix the JSON and try again.')
          setSaving(false)
          return
        }
      }

      console.log('Saving theme to BigQuery:', {
        pageId: pageData.page_id,
        did: did,
        theme: themeToSave
      })

      const response = await fetch(`/api/pages/${did}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pageId: pageData.page_id,
          current_theme: themeToSave,
          previous_theme: pageData.current_theme
        })
      })

      if (response.ok) {
        const updatedPage = await response.json()
        console.log('Theme saved successfully:', updatedPage)
        setTheme(themeToSave)
        onSave(updatedPage)
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 3000)
        // Don't close immediately - let user continue editing
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Save failed:', response.status, errorData)
        throw new Error(`Failed to save changes: ${response.status}`)
      }
    } catch (error) {
      console.error('Failed to save page:', error)
      alert(`Failed to save changes: ${error.message}. Please try again.`)
    } finally {
      setSaving(false)
    }
  }

  const handleTabSwitch = (tab: 'form' | 'json') => {
    if (tab === 'json' && activeTab === 'form') {
      // Switching from form to JSON - update JSON with current form data
      setJsonData(JSON.stringify(formData, null, 2))
    } else if (tab === 'form' && activeTab === 'json') {
      // Switching from JSON to form - try to parse JSON and update form
      try {
        const parsedTheme = JSON.parse(jsonData)
        setFormData(parsedTheme)
      } catch (error) {
        alert('Invalid JSON format. Please fix the JSON before switching tabs.')
        return
      }
    }
    setActiveTab(tab)
  }

  const updateFormData = (section: keyof ThemeConfig, key: string, value: any) => {
    const newFormData = {
      ...formData,
      [section]: {
        ...formData[section],
        [key]: value
      }
    }
    handleLiveUpdate(newFormData)
  }

  const updateNestedFormData = (section: keyof ThemeConfig, subsection: string, key: string, value: any) => {
    const newFormData = {
      ...formData,
      [section]: {
        ...formData[section],
        [subsection]: {
          ...(formData[section] as any)[subsection],
          [key]: value
        }
      }
    }
    handleLiveUpdate(newFormData)
  }

  const handleLiveUpdate = (newFormData: ThemeConfig) => {
    setFormData(newFormData)
    setTheme(newFormData) // Apply theme immediately for live preview
  }

  if (!isOpen) return null

  return (
    <div className="live-editor-container">
      <div className="live-editor-sidebar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2>Edit Page Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            style={{ padding: '1.5rem', margin: '-1.5rem' }}
          >
            ×
          </button>
        </div>
        
        <div className="form-content">

        {/* Tab Navigation */}
        <div className="edit-tabs">
          <button
            type="button"
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('form')}
          >
            Form Editor
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'json' ? 'active' : ''}`}
            onClick={() => handleTabSwitch('json')}
          >
            JSON Editor
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 'form' ? (
            <>
              {/* Colors Section */}
              <div className="form-section">
                <h3>🎨 Colors</h3>
                <div className="color-input-group">
                  {Object.entries(formData.colors).map(([key, value]) => (
                    <div key={key} className="color-row">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateFormData('colors', key, e.target.value)}
                        className="color-preview"
                        style={{ backgroundColor: value }}
                      />
                      <div className="color-info">
                        <div className="color-label">{key}</div>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateFormData('colors', key, e.target.value)}
                          className="color-value"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fonts Section */}
              <div className="form-section">
                <h3>🔤 Fonts</h3>
                <div className="font-grid">
                  <div className="form-group">
                    <label className="layout-label">Heading Font:</label>
                    <select
                      value={formData.fonts.heading}
                      onChange={(e) => updateFormData('fonts', 'heading', e.target.value)}
                      className="select-input"
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                      <option value="Monaco, monospace">Monaco</option>
                      <option value="'Courier New', monospace">Courier New</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="layout-label">Body Font:</label>
                    <select
                      value={formData.fonts.body}
                      onChange={(e) => updateFormData('fonts', 'body', e.target.value)}
                      className="select-input"
                    >
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                      <option value="Monaco, monospace">Monaco</option>
                    </select>
                  </div>
                </div>

                <div className="font-size-grid">
                  <div className="font-size-item">
                    <label className="font-size-label">Small Size</label>
                    <input
                      type="text"
                      value={formData.fonts.size.small}
                      onChange={(e) => updateNestedFormData('fonts', 'size', 'small', e.target.value)}
                      className="text-input"
                      placeholder="12px"
                    />
                  </div>
                  <div className="font-size-item">
                    <label className="font-size-label">Medium Size</label>
                    <input
                      type="text"
                      value={formData.fonts.size.medium}
                      onChange={(e) => updateNestedFormData('fonts', 'size', 'medium', e.target.value)}
                      className="text-input"
                      placeholder="14px"
                    />
                  </div>
                  <div className="font-size-item">
                    <label className="font-size-label">Large Size</label>
                    <input
                      type="text"
                      value={formData.fonts.size.large}
                      onChange={(e) => updateNestedFormData('fonts', 'size', 'large', e.target.value)}
                      className="text-input"
                      placeholder="18px"
                    />
                  </div>
                </div>
              </div>

              {/* Layout Section */}
              <div className="form-section">
                <h3>📐 Layout</h3>
                <div className="layout-grid">
                  <div className="layout-item">
                    <label className="layout-label">Profile Position:</label>
                    <select
                      value={formData.layout.profilePosition}
                      onChange={(e) => updateFormData('layout', 'profilePosition', e.target.value)}
                      className="select-input"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="center">Center</option>
                    </select>
                  </div>

                  <div className="layout-item">
                    <label className="layout-label">Music Player:</label>
                    <select
                      value={formData.layout.musicPlayer}
                      onChange={(e) => updateFormData('layout', 'musicPlayer', e.target.value)}
                      className="select-input"
                    >
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="sidebar">Sidebar</option>
                    </select>
                  </div>

                  <div className="layout-item">
                    <label className="layout-label">Friends List:</label>
                    <select
                      value={formData.layout.friendsList}
                      onChange={(e) => updateFormData('layout', 'friendsList', e.target.value)}
                      className="select-input"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="hidden">Hidden</option>
                    </select>
                  </div>

                  <div className="layout-item">
                    <label className="layout-label">Content Width:</label>
                    <select
                      value={formData.layout.contentWidth}
                      onChange={(e) => updateFormData('layout', 'contentWidth', e.target.value)}
                      className="select-input"
                    >
                      <option value="600px">Narrow (600px)</option>
                      <option value="800px">Medium (800px)</option>
                      <option value="1000px">Wide (1000px)</option>
                      <option value="1200px">Extra Wide (1200px)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customization Section */}
              <div className="form-section">
                <h3>✨ Effects & Customization</h3>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="layout-label">Background Image URL:</label>
                    <input
                      type="url"
                      value={formData.customization.backgroundImage || ''}
                      onChange={(e) => updateFormData('customization', 'backgroundImage', e.target.value || null)}
                      className="text-input"
                      placeholder="https://example.com/background.jpg"
                    />
                  </div>

                  <div className="form-group">
                    <label className="layout-label">Profile Music URL:</label>
                    <input
                      type="url"
                      value={formData.customization.profileMusic || ''}
                      onChange={(e) => updateFormData('customization', 'profileMusic', e.target.value || null)}
                      className="text-input"
                      placeholder="https://example.com/song.mp3"
                    />
                  </div>

                  <div className="checkbox-group">
                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.customization.animations}
                        onChange={(e) => updateFormData('customization', 'animations', e.target.checked)}
                      />
                      Enable Animations
                    </label>

                    <label className="checkbox-item">
                      <input
                        type="checkbox"
                        checked={formData.customization.glitter}
                        onChange={(e) => updateFormData('customization', 'glitter', e.target.checked)}
                      />
                      Enable Glitter Effect
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* JSON Editor */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-3">Edit Theme JSON</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Edit your theme configuration directly in JSON format. Make sure to follow the correct structure.
                  </p>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <MonacoEditor
                    height="400px"
                    defaultLanguage="json"
                    value={jsonData}
                    onChange={(value) => {
                      setJsonData(value || '')
                      // Try to parse and apply theme in real-time
                      try {
                        const parsedTheme = JSON.parse(value || '')
                        setTheme(parsedTheme)
                      } catch (error) {
                        // Invalid JSON - don't update theme
                      }
                    }}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollbar: {
                        vertical: 'visible'
                      },
                      formatOnPaste: true,
                      formatOnType: true
                    }}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <p><strong>Tip:</strong> Use Ctrl+Shift+F to format your JSON automatically.</p>
                  <p>The editor will validate your JSON syntax as you type.</p>
                </div>
              </div>
            </>
          )}

          </form>
        </div>
        
        {/* Action Buttons */}
        <div className="button-group">
          <button
            type="button"
            onClick={onClose}
            className="cancel-button"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="save-button"
            disabled={saving}
            style={saveSuccess ? {
              background: 'linear-gradient(135deg, #059669, #10b981)',
            } : {}}
          >
            {saving ? 'Saving...' : saveSuccess ? '✓ Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
      
      <div className="live-editor-preview">
        <div className="preview-header">
          <h3>Live Preview</h3>
          <div className="preview-controls">
            <button onClick={onClose} className="close-preview-btn">
              ← Close Editor
            </button>
          </div>
        </div>
        <div className="preview-content">
          {previewContent}
        </div>
      </div>
    </div>
  )
}