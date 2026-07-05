import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { responsesAPI } from '../../services/api'
import './ResponsesPanel.css'

const fmtDate = value => value ? new Date(value).toLocaleString() : 'Not recorded'
const fmtSeconds = seconds => {
  const total = Number(seconds || 0)
  if (!total) return 'Not recorded'
  if (total < 60) return `${total}s`
  return `${Math.floor(total / 60)}m ${total % 60}s`
}
const fmtSize = bytes => {
  const size = Number(bytes || 0)
  if (!size) return 'Unknown size'
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
const isImage = file => (file.content_type || '').startsWith('image/')
const isPdf = file => (file.content_type || '').includes('pdf') || file.filename?.toLowerCase().endsWith('.pdf')

export default function ResponsesPanel({ form, onCountChange }) {
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [previewFile, setPreviewFile] = useState(null)
  const [exporting, setExporting] = useState('')

  const fields = useMemo(() => (form.fields_json || []).filter(field => field.type !== 'section'), [form.fields_json])

  let currentUser = null
  try { currentUser = JSON.parse(localStorage.getItem('fc_user') || 'null') } catch { currentUser = null }
  const isOwner = currentUser && form.owner_username && currentUser.username === form.owner_username

  const load = async () => {
    setLoading(true)
    try {
      const r = await responsesAPI.list(form.slug)
      const list = Array.isArray(r.data) ? r.data : []
      setResponses(list)
      onCountChange?.(list.length)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load responses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [form.slug])

  const handleDelete = async id => {
    if (!window.confirm('Delete this response?')) return
    try {
      await responsesAPI.deleteOne(form.slug, id)
      toast.success('Response deleted')
      setSelected(null)
      load()
    } catch {
      toast.error('Failed to delete response')
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Delete all responses? This cannot be undone.')) return
    try {
      await responsesAPI.clearAll(form.slug)
      toast.success('All responses cleared')
      setSelected(null)
      load()
    } catch {
      toast.error('Failed to clear responses')
    }
  }

  const downloadBlob = (blobData, filename) => {
    const blob = blobData instanceof Blob ? blobData : new Blob([blobData])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExport = async type => {
    if (!responses.length) {
      toast.error('No responses to export')
      return
    }
    setExporting(type)
    try {
      const safeTitle = form.title.replace(/[^a-z0-9]/gi, '_')
      if (type === 'csv') {
        const r = await responsesAPI.exportCSV(form.slug)
        downloadBlob(r.data, `${safeTitle}_responses.csv`)
        toast.success('CSV downloaded')
      } else {
        const r = await responsesAPI.exportExcel(form.slug)
        downloadBlob(r.data, `${safeTitle}_responses.xlsx`)
        toast.success('Excel downloaded')
      }
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting('')
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

  const filtered = responses.filter(response => {
    const haystack = JSON.stringify({
      answers: response.data_json,
      email: response.email,
      ip: response.ip_address,
      files: response.files?.map(file => file.filename),
    }).toLowerCase()
    return !search || haystack.includes(search.toLowerCase())
  })

  const getVal = (response, field) => {
    const value = response.data_json?.[field.id] ?? response.data_json?.[field.label] ?? ''
    if (Array.isArray(value)) return value.join(', ')
    if (value && typeof value === 'object') return JSON.stringify(value)
    return String(value || '')
  }

  const filesForField = (response, field) => (response.files || []).filter(file => file.field_id === field.id)

  return (
    <div className="resp-panel">
      <div className="resp-hero">
        <div>
          <h2>Responses</h2>
          <p>{responses.length} total response{responses.length === 1 ? '' : 's'} collected for this form.</p>
        </div>
        <div className="resp-actions">
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>Refresh</button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv')} disabled={Boolean(exporting) || !responses.length}>
            {exporting === 'csv' ? 'Exporting...' : 'Export CSV'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => handleExport('excel')} disabled={Boolean(exporting) || !responses.length}>
            {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleClear} disabled={!responses.length || !isOwner} title={isOwner ? 'Clear responses' : 'Only the owner can clear responses'}>
            Clear all
          </button>
        </div>
      </div>

      <div className="resp-filter">
        <input className="input search-inp" placeholder="Search responses, files, email or IP" value={search} onChange={e => setSearch(e.target.value)} />
        <span>{loading ? 'Loading...' : `${filtered.length} shown`}</span>
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
                <th>Files</th>
                <th className="actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((response, index) => (
                <tr key={response.id}>
                  <td className="index-cell">{index + 1}</td>
                  <td className="ts-cell">{fmtDate(response.submitted_at)}</td>
                  {fields.map(field => {
                    const value = getVal(response, field)
                    const fieldFiles = filesForField(response, field)
                    return (
                      <td key={field.id} className="data-cell" title={value}>
                        {fieldFiles.length ? <FileStrip files={fieldFiles} onPreview={setPreviewFile} compact /> : value || <span className="muted">Blank</span>}
                      </td>
                    )
                  })}
                  <td className="files-cell">{response.files?.length ? <FileStrip files={response.files} onPreview={setPreviewFile} compact /> : <span className="muted">None</span>}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setSelected(response)}>View</button>
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

      {selected && (
        <DetailModal
          response={selected}
          fields={fields}
          getVal={getVal}
          onClose={() => setSelected(null)}
          onDelete={isOwner ? handleDelete : null}
          onEdit={isOwner ? () => { setEditing(selected); setSelected(null) } : null}
          onPreview={setPreviewFile}
        />
      )}
      {editing && <EditModal response={editing} fields={fields} onSave={handleEditSave} onClose={() => setEditing(null)} />}
      {previewFile && <ImagePreview file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  )
}

function FileStrip({ files, onPreview, compact = false }) {
  return (
    <div className={compact ? 'file-strip compact' : 'file-strip'}>
      {files.map(file => (
        <div className="file-pill" key={file.id}>
          {isImage(file) ? (
            <button className="file-thumb-btn" onClick={() => onPreview(file)} title={file.filename}>
              <img src={file.url} alt={file.filename} />
            </button>
          ) : (
            <span className="file-icon">{isPdf(file) ? 'PDF' : 'FILE'}</span>
          )}
          {!compact && (
            <div className="file-meta">
              <strong>{file.filename}</strong>
              <span>{fmtSize(file.size)} · {fmtDate(file.uploaded_at)}</span>
            </div>
          )}
          <a className="btn btn-ghost btn-sm" href={file.url} target={isPdf(file) ? '_blank' : undefined} rel="noreferrer" download={!isPdf(file)}>
            {isPdf(file) ? 'Open' : 'Download'}
          </a>
        </div>
      ))}
    </div>
  )
}

function DetailModal({ response, fields, getVal, onClose, onDelete, onEdit, onPreview }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card resp-detail-modal">
        <div className="modal-header">
          <h2>Response #{response.id}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>x</button>
        </div>
        <div className="modal-body">
          <div className="detail-grid">
            <Info label="Submitted" value={fmtDate(response.submitted_at)} />
            <Info label="Email" value={response.email || 'Not captured'} />
            <Info label="IP" value={response.ip_address || 'Not captured'} />
            <Info label="Completion time" value={fmtSeconds(response.time_to_complete)} />
          </div>

          <h3 className="detail-heading">Answers</h3>
          <div className="answer-list">
            {fields.map(field => {
              const value = getVal(response, field)
              return (
                <div className="answer-row" key={field.id}>
                  <span>{field.label}</span>
                  <strong>{value || 'Blank'}</strong>
                </div>
              )
            })}
          </div>

          <h3 className="detail-heading">Uploaded files</h3>
          {response.files?.length ? <FileStrip files={response.files} onPreview={onPreview} /> : <p className="muted">No files uploaded with this response.</p>}
        </div>
        <div className="modal-footer">
          {onDelete && <button className="btn btn-danger" onClick={() => onDelete(response.id)}>Delete Response</button>}
          {onEdit && <button className="btn btn-outline" onClick={onEdit}>Edit</button>}
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

function Info({ label, value }) {
  return (
    <div className="detail-info">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ImagePreview({ file, onClose }) {
  return (
    <div className="modal-backdrop image-lightbox" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="image-lightbox-box">
        <div className="image-lightbox-top">
          <span>{file.filename}</span>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>x</button>
        </div>
        <img src={file.url} alt={file.filename} />
      </div>
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
