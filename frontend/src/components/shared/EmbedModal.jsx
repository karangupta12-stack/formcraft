import { useEffect, useState } from 'react'
import { formsAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function EmbedModal({ formSlug, onClose }) {
  const [code, setCode] = useState('')

  useEffect(() => {
    formsAPI.getEmbed(formSlug)
      .then(r => setCode(r.data.embed_code))
      .catch(() => toast.error('Failed to get embed code'))
  }, [formSlug])

  const copy = () => { navigator.clipboard.writeText(code); toast.success('Embed code copied!') }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>🖼️ Embed on Website</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ padding:'1.25rem 1.5rem' }}>
          <p style={{ fontSize:'0.875rem', color:'var(--text2)', marginBottom:'1rem' }}>
            Paste this code into any HTML page to embed your form directly.
          </p>
          <textarea
            readOnly value={code}
            style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--primary-l)', fontFamily:'monospace', fontSize:'0.78rem', padding:'0.875rem', resize:'vertical', minHeight:100 }}
          />
          <p style={{ fontSize:'0.78rem', color:'var(--text3)', marginTop:'0.5rem' }}>
            You can adjust the width and height attributes as needed.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary" onClick={copy}>Copy Code</button>
        </div>
      </div>
    </div>
  )
}
