import { useEffect, useState } from 'react'
import { formsAPI } from '../../services/api'
import toast from 'react-hot-toast'

export default function QRModal({ formSlug, onClose }) {
  const [qr,      setQr]      = useState('')
  const [url,     setUrl]     = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    formsAPI.getQR(formSlug)
      .then(r => { setQr(r.data.qr_base64); setUrl(r.data.form_url) })
      .catch(() => toast.error('Failed to generate QR'))
      .finally(() => setLoading(false))
  }, [formSlug])

  const download = () => {
    const a = document.createElement('a')
    a.href = qr; a.download = 'formcraft-qr.png'; a.click()
  }

  const copyUrl = () => { navigator.clipboard.writeText(url); toast.success('Link copied!') }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box card" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h2>📱 QR Code</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ textAlign:'center', padding:'1.5rem' }}>
          {loading
            ? <svg className="spinner" viewBox="0 0 24 24" width="40" height="40"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg>
            : <>
                <img src={qr} alt="Form QR Code" style={{ width:200, height:200, borderRadius:12, background:'#fff', padding:8 }} />
                <p style={{ fontSize:'0.78rem', color:'var(--text3)', marginTop:'0.75rem', wordBreak:'break-all' }}>{url}</p>
              </>
          }
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={copyUrl}>Copy Link</button>
          <button className="btn btn-primary" onClick={download} disabled={!qr}>⬇ Download QR</button>
        </div>
      </div>
    </div>
  )
}
