'use client'

import { useState } from 'react'
import { X, Sparkles, Palette, Code, Upload } from 'lucide-react'

interface EditHomepageModalProps {
  onClose: () => void
}

export default function EditHomepageModal({ onClose }: EditHomepageModalProps) {
  const [activeTab, setActiveTab] = useState<'ai-theme' | 'manual-code' | 'templates'>('ai-theme')
  const [aiPrompt, setAiPrompt] = useState('')
  const [customHtml, setCustomHtml] = useState('')
  const [customCss, setCustomCss] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    
    setIsGenerating(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      alert('AI theme generated! (This would integrate with Gemini API)')
    } catch (error) {
      alert('Error generating theme')
    } finally {
      setIsGenerating(false)
    }
  }

  const themePresets = [
    { name: 'MySpace Classic', description: 'Nostalgic early 2000s vibes' },
    { name: 'Cyberpunk Neon', description: 'Futuristic with neon accents' },
    { name: 'Minimal Dark', description: 'Clean and modern dark theme' },
    { name: 'Retro Synthwave', description: '80s inspired aesthetic' },
    { name: 'Nature Organic', description: 'Earth tones and organic shapes' },
    { name: 'Abstract Art', description: 'Artistic and colorful design' }
  ]

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '700px', maxHeight: '90vh' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2>Edit Homepage</h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
          <button
            className={`tab ${activeTab === 'ai-theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('ai-theme')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={16} />
            AI Theme
          </button>
          <button
            className={`tab ${activeTab === 'manual-code' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual-code')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Code size={16} />
            Manual Code
          </button>
          <button
            className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Palette size={16} />
            Templates
          </button>
        </div>

        {activeTab === 'ai-theme' && (
          <div>
            <div className="form-group">
              <label htmlFor="ai-prompt">Describe your ideal theme</label>
              <textarea
                id="ai-prompt"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g., 'A cyberpunk theme with neon purple and blue colors, glitch effects, and a futuristic grid background'"
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Quick Theme Ideas:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {themePresets.map((preset) => (
                  <button
                    key={preset.name}
                    className="btn btn-secondary"
                    onClick={() => setAiPrompt(`Create a ${preset.name.toLowerCase()} theme: ${preset.description}`)}
                    style={{ 
                      textAlign: 'left', 
                      padding: '12px',
                      height: 'auto',
                      lineHeight: '1.3'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{preset.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button 
              className="btn"
              onClick={handleAIGenerate}
              disabled={!aiPrompt.trim() || isGenerating}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                opacity: (!aiPrompt.trim() || isGenerating) ? 0.6 : 1
              }}
            >
              <Sparkles size={16} />
              {isGenerating ? 'Generating Theme...' : 'Generate with AI'}
            </button>
          </div>
        )}

        {activeTab === 'manual-code' && (
          <div>
            <div className="form-group">
              <label htmlFor="custom-html">Custom HTML</label>
              <textarea
                id="custom-html"
                value={customHtml}
                onChange={(e) => setCustomHtml(e.target.value)}
                placeholder="<div>Your custom HTML here...</div>"
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="custom-css">Custom CSS</label>
              <textarea
                id="custom-css"
                value={customCss}
                onChange={(e) => setCustomCss(e.target.value)}
                placeholder=".your-class { color: #fff; }"
                rows={8}
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn">
                Preview Changes
              </button>
              <button className="btn btn-secondary">
                <Upload size={16} style={{ marginRight: '6px' }} />
                Upload Files
              </button>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              Choose from pre-made templates or upload your own design files:
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  style={{
                    aspectRatio: '4/3',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  Template {i}
                </div>
              ))}
            </div>

            <button className="btn btn-secondary">
              <Upload size={16} style={{ marginRight: '6px' }} />
              Upload Custom Template
            </button>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border)'
        }}>
          <button className="btn">
            Apply Changes
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}