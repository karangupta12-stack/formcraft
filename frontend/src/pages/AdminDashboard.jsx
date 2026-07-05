import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { formsAPI } from '../services/api'
import toast from 'react-hot-toast'
import FormsList  from '../components/builder/FormsList'
import FormEditor from '../components/builder/FormEditor'
import './Admin.css'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [forms,       setForms]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [loadError,   setLoadError]   = useState('')
  const [activeForm,  setActiveForm]  = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const loadForms = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const r = await formsAPI.list()
      console.debug('formsAPI.list =>', r)
      setForms(r.data)
    } catch (err) {
      console.error('Failed to load forms', err)
      setLoadError(err.response?.data?.error || err.message || 'Failed to load forms')
      toast.error('Failed to load forms')
    } finally { setLoading(false) }
  }

  useEffect(() => { loadForms() }, [])

  const createForm = async () => {
    try {
      const r = await formsAPI.create({ title: 'Untitled Form', description: '', fields_json: [] })
      toast.success('New form created!')
      setForms(prev => [r.data, ...prev])
      setActiveForm(r.data)
    } catch { toast.error('Failed to create form') }
  }

  const deleteForm = async (slug) => {
    if (!window.confirm('Delete this form and all its responses?')) return
    try {
      await formsAPI.remove(slug)
      toast.success('Form deleted')
      setForms(prev => prev.filter(f => f.slug !== slug))
      if (activeForm?.slug === slug) setActiveForm(null)
    } catch { toast.error('Failed to delete') }
  }

  const duplicateForm = async (slug) => {
    try {
      const r = await formsAPI.duplicate(slug)
      toast.success('Form duplicated!')
      setForms(prev => [r.data, ...prev])
      return r.data
    } catch { toast.error('Failed to duplicate') }
  }

  const doLogout = () => { logout(); navigate('/') }

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/>
              </svg>
            </div>
            <span>FormCraft</span>
          </div>

          <button className="btn btn-primary btn-sm sidebar-create" onClick={() => { createForm(); setSidebarOpen(false) }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New Form
          </button>

          <div className="sidebar-forms-label">MY FORMS <span className="badge badge-purple">{forms.length}</span></div>

          <nav className="sidebar-forms-list">
            {loading
              ? <div className="sidebar-loading"><svg className="spinner" viewBox="0 0 24 24" width="20" height="20"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg></div>
              : loadError
                ? <div className="sidebar-empty">Error loading forms: {loadError}<br/><button className="btn btn-ghost btn-sm" onClick={loadForms}>Retry</button></div>
                : forms.length === 0
                  ? <div className="sidebar-empty">No forms yet.<br/>Click "New Form" above.</div>
                : forms.map(f => (
                    <button
                      key={f.slug}
                      className={`sidebar-form-btn ${activeForm?.slug === f.slug ? 'active' : ''}`}
                      onClick={() => { setActiveForm(f); setSidebarOpen(false) }}
                    >
                      <div className="sfb-info">
                        <span className="sfb-title">{f.title}</span>
                        <span className="sfb-meta">{f.response_count} response{f.response_count !== 1 ? 's' : ''} · <span className={`sfb-status ${f.status}`}>{f.status}</span></span>
                      </div>
                    </button>
                  ))
            }
          </nav>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{(user?.display_name || user?.username || '?')[0].toUpperCase()}</div>
          <div className="user-info">
            <strong>{user?.display_name || user?.username}</strong>
            <span>@{user?.username}</span>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" title="Logout" onClick={doLogout}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <div className="admin-main">
        <header className="admin-header">
          <button className="btn btn-ghost btn-icon hamburger" onClick={() => setSidebarOpen(s => !s)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="header-title">
            {activeForm
              ? <><button className="btn btn-ghost btn-sm" onClick={() => setActiveForm(null)}>← Forms</button><span className="header-form-name hide-mobile">{activeForm.title}</span></>
              : <h1>My Forms</h1>
            }
          </div>
          {!activeForm && (
            <button className="btn btn-primary btn-sm" onClick={createForm}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              <span className="hide-mobile">New Form</span>
            </button>
          )}
        </header>

        <div className="admin-content">
          {activeForm
            ? <FormEditor
                key={activeForm.slug}
                formSlug={activeForm.slug}
                onDelete={() => deleteForm(activeForm.slug)}
                onDuplicate={async () => { await duplicateForm(activeForm.slug) }}
                onUpdate={(updated) => {
                  setForms(prev => prev.map(f => f.slug === updated.slug ? { ...f, ...updated } : f))
                  setActiveForm(prev => ({ ...prev, ...updated }))
                }}
              />
            : <FormsList
                forms={forms}
                loading={loading}
                onSelect={setActiveForm}
                onCreate={createForm}
                onDelete={deleteForm}
                onDuplicate={duplicateForm}
              />
          }
        </div>
      </div>
    </div>
  )
}
