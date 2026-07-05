import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { formsAPI } from '../../services/api'
import AnalyticsPanel from '../analytics/AnalyticsPanel'
import ResponsesPanel from '../responses/ResponsesPanel'
import EmbedModal from '../shared/EmbedModal'
import QRModal from '../shared/QRModal'
import FormBuilder from './FormBuilder'
import SettingsPanel from './SettingsPanel'
import './FormEditor.css'

const TABS = [
  { id: 'builder', label: 'Builder' },
  { id: 'responses', label: 'Responses' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

export default function FormEditor({ formSlug, onDelete, onDuplicate, onUpdate }) {
  const [form, setForm] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('builder')
  const [saving, setSaving] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [respCount, setRespCount] = useState(0)
  const [builderDraft, setBuilderDraft] = useState(null)
  const [builderDirty, setBuilderDirty] = useState(false)
  const autosaveTimer = useRef(null)

  useEffect(() => {
    setLoading(true)
    formsAPI.get(formSlug)
      .then(r => { setForm(r.data); onUpdate?.(r.data) })
      .catch(() => toast.error('Failed to load form'))
      .finally(() => setLoading(false))
  }, [formSlug])

  const saveForm = async updates => {
    setSaving(true)
    try {
      const r = await formsAPI.update(formSlug, updates)
      setForm(r.data)
      onUpdate?.(r.data)
      setBuilderDirty(false)
      toast.success('Form saved')
      return r.data
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save form')
      throw err
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current)
      autosaveTimer.current = null
    }
    if (builderDirty && builderDraft) {
      autosaveTimer.current = setTimeout(() => {
        saveForm(builderDraft).catch(() => {})
        autosaveTimer.current = null
      }, 1200)
    }
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current)
        autosaveTimer.current = null
      }
    }
  }, [builderDraft, builderDirty])

  const formLink = `${window.location.origin}/f/${formSlug}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(formLink)
    toast.success('Public form link copied')
  }

  const ensureSaved = async () => {
    if (builderDirty && builderDraft) return saveForm(builderDraft)
    return form
  }

  const handleTabClick = async id => {
    if (tab === 'builder' && id !== 'builder') await ensureSaved().catch(() => null)
    setTab(id)
  }

  const openPreview = async () => {
    await ensureSaved().catch(() => null)
    window.open(formLink, '_blank')
  }

  if (loading) {
    return (
      <div className="fe-loading">
        <svg className="spinner" viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" /></svg>
      </div>
    )
  }

  if (!form) return null

  return (
    <div className="form-editor">
      <div className="fe-topbar">
        <div className="fe-tabs">
          {TABS.map(item => (
            <button key={item.id} className={`fe-tab ${tab === item.id ? 'active' : ''}`} onClick={() => handleTabClick(item.id)}>
              <span className="fe-tab-label">{item.label}</span>
              {item.id === 'responses' && respCount > 0 && <span className="badge badge-purple">{respCount}</span>}
            </button>
          ))}
        </div>
        <div className="fe-actions">
          {saving && <span className="saving-txt">Saving...</span>}
          <button className="btn btn-ghost btn-sm" onClick={copyLink} title="Copy public link">Copy link</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(true)} title="QR code">QR</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEmbed(true)} title="Embed code">Embed</button>
          <button className="btn btn-outline btn-sm" onClick={openPreview}>Preview</button>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate form">Duplicate</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete form">Delete</button>
        </div>
      </div>

      <div className="fe-content">
        {tab === 'builder' && <FormBuilder form={form} onSave={saveForm} saving={saving} onDraftChange={setBuilderDraft} onDirtyChange={setBuilderDirty} />}
        {tab === 'responses' && <ResponsesPanel form={form} onCountChange={setRespCount} />}
        {tab === 'analytics' && <AnalyticsPanel formSlug={formSlug} />}
        {tab === 'settings' && <SettingsPanel form={form} onSave={setForm} />}
      </div>

      {showQR && <QRModal formSlug={formSlug} onClose={() => setShowQR(false)} />}
      {showEmbed && <EmbedModal formSlug={formSlug} onClose={() => setShowEmbed(false)} />}
    </div>
  )
}
