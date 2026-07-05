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
  const [saveStatus, setSaveStatus] = useState('saved')
  const [restoredDraft, setRestoredDraft] = useState(false)
  const autosaveTimer = useRef(null)
  const draftKey = `fc_builder_draft_${formSlug}`

  useEffect(() => {
    setLoading(true)
    setRestoredDraft(false)
    setBuilderDraft(null)
    setBuilderDirty(false)
    setSaveStatus('saved')
    formsAPI.get(formSlug)
      .then(r => {
        let nextForm = r.data
        try {
          const stored = JSON.parse(localStorage.getItem(draftKey) || 'null')
          if (stored?.draft) {
            nextForm = { ...nextForm, ...stored.draft }
            setBuilderDraft(stored.draft)
            setBuilderDirty(true)
            setSaveStatus('unsaved')
            setRestoredDraft(true)
            toast('Restored unsaved draft')
          }
        } catch {
          localStorage.removeItem(draftKey)
        }
        setForm(nextForm)
        setRespCount(r.data.response_count || 0)
        onUpdate?.(r.data)
      })
      .catch(() => toast.error('Failed to load form'))
      .finally(() => setLoading(false))
  }, [formSlug])

  const saveForm = async (updates, options = {}) => {
    setSaving(true)
    setSaveStatus('saving')
    try {
      const r = await formsAPI.update(formSlug, updates)
      setForm(r.data)
      onUpdate?.(r.data)
      setBuilderDirty(false)
      setSaveStatus('saved')
      setRestoredDraft(false)
      localStorage.removeItem(draftKey)
      if (!options.silent) toast.success('Form saved successfully')
      return r.data
    } catch (err) {
      setSaveStatus('unsaved')
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
      setSaveStatus('unsaved')
      localStorage.setItem(draftKey, JSON.stringify({ draft: builderDraft, saved_at: Date.now() }))
      autosaveTimer.current = setTimeout(() => {
        saveForm(builderDraft, { silent: true }).catch(() => {})
        autosaveTimer.current = null
      }, 2500)
    }
    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current)
        autosaveTimer.current = null
      }
    }
  }, [builderDraft, builderDirty])

  useEffect(() => {
    const warn = event => {
      if (!builderDirty) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [builderDirty])

  const formLink = `${window.location.origin}/f/${formSlug}`

  const copyLink = async () => {
    await navigator.clipboard.writeText(formLink)
    toast.success('Public form link copied')
  }

  const ensureSaved = async () => {
    if (builderDirty && builderDraft) return saveForm(builderDraft, { silent: true })
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
          <span className={`saving-txt ${saveStatus}`}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved changes' : 'Saved'}</span>
          {tab === 'builder' && (
            <button className="btn btn-primary btn-sm" onClick={() => builderDraft && saveForm(builderDraft)} disabled={saving || !builderDirty}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={copyLink} title="Copy public link">Copy link</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowQR(true)} title="QR code">QR</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowEmbed(true)} title="Embed code">Embed</button>
          <button className="btn btn-outline btn-sm" onClick={openPreview}>Preview</button>
          <button className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate form">Duplicate</button>
          <button className="btn btn-danger btn-sm" onClick={onDelete} title="Delete form">Delete</button>
        </div>
      </div>

      <div className="fe-content">
        {tab === 'builder' && <FormBuilder form={form} onSave={saveForm} saving={saving} onDraftChange={setBuilderDraft} onDirtyChange={setBuilderDirty} initialDirty={restoredDraft} />}
        {tab === 'responses' && <ResponsesPanel form={form} onCountChange={count => {
          setRespCount(count)
          onUpdate?.({ ...form, response_count: count })
        }} />}
        {tab === 'analytics' && <AnalyticsPanel formSlug={formSlug} />}
        {tab === 'settings' && <SettingsPanel form={form} onSave={updater => {
          setForm(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            onUpdate?.(next)
            return next
          })
        }} />}
      </div>

      {showQR && <QRModal formSlug={formSlug} onClose={() => setShowQR(false)} />}
      {showEmbed && <EmbedModal formSlug={formSlug} onClose={() => setShowEmbed(false)} />}
    </div>
  )
}
