import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { responsesAPI } from '../../services/api'
import './ResponsesPanel.css'

export default function ResponsesPanel({ form, onCountChange }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [exporting, setExporting] = useState(false)

  const fields = useMemo(() => (form.fields_json || []).filter(field => field.type !== 'section'), [form.fields_json])

  let currentUser = null
  try { currentUser = JSON.parse(localStorage.getItem('fc_user') || 'null') } catch { currentUser = null }
  const isOwner = currentUser && form.owner_username && currentUser.username === form.owner_username

  const load = async () => {
    setLoading(true)
    try {
      const r = await responsesAPI.list(form.slug)
      setResponses(r.data)
      onCountChange?.(r.data.length)
    } catch {
      toast.error('Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [form.slug])

  const handleDelete = async id => {
    if (!window.confirm('Delete this response?')) return
    await responsesAPI.deleteOne(form.slug, id)
    toast.success('Response deleted')
    load()
  }

  const handleClear = async () => {
    if (!window.confirm('Delete all responses? This cannot be undone.')) return
    await responsesAPI.clearAll(form.slug)
    toast.success('All responses cleared')
    load()
  }

  const handleExport = async () => {
    if (!responses.length) {
      toast.error('No responses to export')
      return
    }
    setExporting(true)
    try {
      const r = await responsesAPI.exportExcel(form.slug)
      const blobData = r.data instanceof Blob ? r.data : new Blob([r.data])
      const url = window.URL.createObjectURL(blobData)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('Excel downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleEditSave = async (id, newData) => {
    try {
      await responsesAPI.edit(form.slug, id, { data_json: newData })
      toast.success('Response updated')
      setEditing(null)
      load()
    } catch {
      toast.error('Failed to update response')
    }
  }

  const filtered = responses.filter(response =>
    !search || JSON.stringify(response.data_json).toLowerCase().includes(search.toLowerCase())
  )

  const getVal = (response, field) => {
    const value = response.data_json[field.id] ?? response.data_json[field.label] ?? ''
    if (Array.isArray(value)) return value.join(', ')
    if (value && typeof value === 'object') return JSON.stringify(value)
    return String(value || '')
  }

  return (
    <div className="resp-panel">
      <div className="resp-hero">
        <div>
          <h2>Responses</h2>
          <p>{responses.length} total response{responses.length === 1 ? '' : 's'} collected for this form.</p>
        </div>
        <div className="resp-actions">
          <button className="btn btn-ghost btn-sm" onClick={load}>Refresh</button>
          <button className="btn btn-outline btn-sm" onClick={handleExport} disabled={exporting || !responses.length}>
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClear} disabled={!responses.length || !isOwner} title={isOwner ? 'Clear responses' : 'Only the owner can clear responses'}>
            Clear all
          </button>
        </div>
      </div>

      <div className="resp-filter">
        <input className="input search-inp" placeholder="Search responses" value={search} onChange={e => setSearch(e.target.value)} />
        <span>{filtered.length} shown</span>
      </div>

      {loading ? (
        <div className="resp-loading"><svg className="spinner" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round" /></svg></div>
      ) : filtered.length === 0 ? (
        <div className="resp-empty">
          <h3>{responses.length === 0 ? 'No responses yet' : 'No matching responses'}</h3>
          <p>{responses.length === 0 ? 'Copy the public link from the toolbar or Settings > Share to start collecting responses.' : 'Try a different search term.'}</p>
        </div>
      ) : (
        <div className="resp-table-wrap">
          <table className="resp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Submitted</th>
                {fields.map(field => <th key={field.id}>{field.label}</th>)}
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((response, index) => (
                <tr key={response.id}>
                  <td className="index-cell">{index + 1}</td>
                  <td className="ts-cell">{new Date(response.submitted_at).toLocaleString()}</td>
                  {fields.map(field => {
                    const value = getVal(response, field)
                    return <td key={field.id} className="data-cell" title={value}>{value || <span className="muted">Blank</span>}</td>
                  })}
                  <td>
                    <div className="row-actions">
                      {isOwner ? (
                        <>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(response)}>Edit</button>
                          <button className="btn btn-ghost btn-sm danger-btn" onClick={() => handleDelete(response.id)}>Delete</button>
                        </>
                      ) : (
                        <span className="muted">Owner only</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && <EditModal response={editing} fields={fields} onSave={handleEditSave} onClose={() => setEditing(null)} />}
    </div>
  )
}

function EditModal({ response, fields, onSave, onClose }) {
  const [data, setData] = useState({ ...response.data_json })

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2>Edit response</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          {fields.map(field => (
            <div className="field-group" key={field.id}>
              <label className="label">{field.label}</label>
              {field.type === 'textarea'
                ? <textarea className="textarea" value={data[field.id] || ''} onChange={e => setData(prev => ({ ...prev, [field.id]: e.target.value }))} />
                : <input className="input" value={data[field.id] || ''} onChange={e => setData(prev => ({ ...prev, [field.id]: e.target.value }))} />
              }
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(response.id, data)}>Save changes</button>
        </div>
      </div>
    </div>
  )
}
