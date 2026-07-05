import { useState } from 'react'
import { formsAPI } from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { authAPI } from '../../services/api'
import toast from 'react-hot-toast'
import './SettingsPanel.css'

const COLORS = ['#7c3aed','#3b82f6','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#8b5cf6','#14b8a6','#f97316']
const FONTS  = ['Inter','Poppins','Roboto','Playfair Display','Space Grotesk']

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
}

export default function SettingsPanel({ form, onSave }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [tab,    setTab]    = useState('general')

  // General
  const [status,  setStatus]  = useState(form.status || 'active')
  const [msg,     setMsg]     = useState(form.settings?.confirmation_message || 'Your response has been recorded!')
  const [limit,   setLimit]   = useState(form.settings?.submission_limit_mode || 'unlimited')
  const [maxResp, setMaxResp] = useState(form.max_responses || '')
  const [expires, setExpires] = useState(form.expires_at ? form.expires_at.slice(0,16) : '')
  const [redirect,setRedirect]= useState(form.settings?.redirect_url || '')

  // Password
  const [pwEnabled, setPwEnabled] = useState(Boolean(form.settings?.password_hash))
  const [newPw,     setNewPw]     = useState('')

  // Email notifications
  const [notifyOn,    setNotifyOn]    = useState(form.settings?.notify_on_submit || false)
  const [notifyEmail, setNotifyEmail] = useState(form.settings?.notify_email || user?.email || '')

  // Branding
  const br = form.branding || {}
  const [color,   setColor]   = useState(br.primary_color || '#7c3aed')
  const [font,    setFont]    = useState(br.font || 'Inter')
  const [bgColor, setBgColor] = useState(br.bg_color || '#0f0f1a')
  const [bgType,  setBgType]  = useState(br.bg_type || 'solid')
  const [bgPat,   setBgPat]   = useState(br.bg_pattern || 'dots')
  const [logoFile,setLogoFile]= useState(null)
  const [bannerFile,setBannerFile]= useState(null)

  // Change password
  const [cpCur,  setCpCur]  = useState('')
  const [cpNew,  setCpNew]  = useState('')
  const [cpConf, setCpConf] = useState('')

  const formLink = `${window.location.origin}/f/${form.slug}`
  const copyLink = () => { navigator.clipboard.writeText(formLink); toast.success('Link copied!') }

  const saveGeneral = async () => {
    setSaving(true)
    try {
      // Update form-level fields
      await formsAPI.update(form.slug, {
        status,
        max_responses: maxResp || null,
        expires_at: expires || null,
      })
      // Update settings
      const payload = { confirmation_message: msg, submission_limit_mode: limit, redirect_url: redirect, notify_on_submit: notifyOn, notify_email: notifyEmail }
      if (pwEnabled && newPw) payload.password_hash = await sha256(newPw)
      else if (!pwEnabled)    payload.password_hash = ''
      const r = await formsAPI.updateSettings(form.slug, payload)
      toast.success('Settings saved!')
      onSave(prev => ({ ...prev, status, max_responses: maxResp || null, expires_at: expires || null, settings: r.data }))
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  const saveBranding = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('primary_color', color)
      fd.append('font', font)
      fd.append('bg_color', bgColor)
      fd.append('bg_type', bgType)
      fd.append('bg_pattern', bgPat)
      if (logoFile) fd.append('logo', logoFile)
      if (bannerFile) fd.append('banner', bannerFile)
      const r = await formsAPI.updateBranding(form.slug, fd)
      toast.success('Branding saved!')
      onSave(prev => ({ ...prev, branding: r.data }))
    } catch { toast.error('Failed to save branding') }
    finally { setSaving(false) }
  }

  const changePassword = async () => {
    if (!cpCur || !cpNew) return toast.error('Fill all fields')
    if (cpNew !== cpConf) return toast.error('Passwords do not match')
    setSaving(true)
    try {
      const r = await authAPI.changePassword({ current_password: cpCur, new_password: cpNew, confirm_password: cpConf })
      localStorage.setItem('fc_token', r.data.access)
      toast.success('Password changed!')
      setCpCur(''); setCpNew(''); setCpConf('')
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to change password') }
    finally { setSaving(false) }
  }

  const TABS = [
    { id:'general',  label:'General' },
    { id:'notifications', label:'Notifications' },
    { id:'branding', label:'Branding' },
    { id:'account',  label:'Account' },
    { id:'share',    label:'Share' },
  ]

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`settings-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="settings-section card">
          <h3>Form Settings</h3>

          <div className="field-group">
            <label className="label">Form Status</label>
            <select className="select" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="active">Active — accepting responses</option>
              <option value="closed">Closed — not accepting</option>
              <option value="draft">Draft — not published</option>
            </select>
          </div>

          <div className="field-group">
            <label className="label">Confirmation Message</label>
            <input className="input" value={msg} onChange={e=>setMsg(e.target.value)} />
          </div>

          <div className="field-group">
            <label className="label">Redirect URL after submit (optional)</label>
            <input className="input" value={redirect} onChange={e=>setRedirect(e.target.value)} placeholder="https://your-site.com/thank-you" />
          </div>

          <div className="field-group">
            <label className="label">Submission Limit</label>
            <select className="select" value={limit} onChange={e=>setLimit(e.target.value)}>
              <option value="unlimited">Unlimited</option>
              <option value="browser">One per browser</option>
              <option value="email">One per email</option>
            </select>
            <span className="helper-text">Browser mode uses a saved browser fingerprint. Email mode blocks repeated email addresses and needs an email answer in the form.</span>
          </div>

          <div className="settings-row-2">
            <div className="field-group">
              <label className="label">Max Responses (optional)</label>
              <input className="input" type="number" min="1" value={maxResp} onChange={e=>setMaxResp(e.target.value)} placeholder="Unlimited" />
            </div>
            <div className="field-group">
              <label className="label">Expires At (optional)</label>
              <input className="input" type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)} />
            </div>
          </div>

          <div className="field-group">
            <label className="toggle-row">
              <input type="checkbox" checked={pwEnabled} onChange={e=>setPwEnabled(e.target.checked)} />
              Password-protect this form
            </label>
            {pwEnabled && <input className="input" type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} placeholder="Set new form password" style={{marginTop:'0.5rem'}} />}
          </div>

          <button className="btn btn-primary btn-sm" onClick={saveGeneral} disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Notifications */}
      {tab === 'notifications' && (
        <div className="settings-section card">
          <h3>Email Notifications</h3>
          <p className="settings-desc">Get an email every time someone submits your form.</p>

          <label className="toggle-row">
            <input type="checkbox" checked={notifyOn} onChange={e=>setNotifyOn(e.target.checked)} />
            Send me an email on each submission
          </label>

          {notifyOn && (
            <div className="field-group" style={{marginTop:'1rem'}}>
              <label className="label">Notification Email <span className="required-star">*</span></label>
              <input className="input" type="email" value={notifyEmail} onChange={e=>setNotifyEmail(e.target.value)} placeholder="you@example.com" />
              <span className="helper-text">Make sure EMAIL_HOST_USER is set in backend/.env for emails to work.</span>
            </div>
          )}

          <button className="btn btn-primary btn-sm" onClick={saveGeneral} disabled={saving}>
            {saving ? 'Saving…' : 'Save Notification Settings'}
          </button>
        </div>
      )}

      {/* Branding */}
      {tab === 'branding' && (
        <div className="settings-section card">
          <h3>Form Branding</h3>

          <div className="field-group">
            <label className="label">Primary Color</label>
            <div className="color-swatches">
              {COLORS.map(c => (
                <button key={c} className={`color-swatch ${color===c?'active':''}`} style={{background:c}} onClick={()=>setColor(c)} />
              ))}
              <input type="color" className="color-picker-input" value={color} onChange={e=>setColor(e.target.value)} title="Custom color" />
            </div>
            <span className="helper-text">Current: {color}</span>
          </div>

          <div className="field-group">
            <label className="label">Font</label>
            <select className="select" value={font} onChange={e=>setFont(e.target.value)}>
              {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="field-group">
            <label className="label">Background</label>
            <div className="radio-group">
              {['solid','pattern'].map(bt=>(
                <label key={bt} className="radio-label">
                  <input type="radio" value={bt} checked={bgType===bt} onChange={()=>setBgType(bt)} />
                  {bt.charAt(0).toUpperCase()+bt.slice(1)}
                </label>
              ))}
            </div>
            <input type="color" className="color-picker-input" value={bgColor} onChange={e=>setBgColor(e.target.value)} title="Background color" style={{marginTop:'0.5rem'}} />
            {bgType==='pattern' && (
              <select className="select" value={bgPat} onChange={e=>setBgPat(e.target.value)} style={{marginTop:'0.5rem'}}>
                <option value="dots">Dots</option>
                <option value="grid">Grid</option>
                <option value="waves">Waves</option>
              </select>
            )}
          </div>

          <div className="field-group">
            <label className="label">Logo (optional)</label>
            <input type="file" accept="image/*" className="input" onChange={e=>setLogoFile(e.target.files[0])} />
            {br.logo_url && <img src={br.logo_url} alt="logo" style={{width:64,height:64,objectFit:'contain',borderRadius:8,marginTop:'0.5rem',background:'var(--bg3)',padding:4}} />}
          </div>

          <div className="field-group">
            <label className="label">Header Image / Banner (optional)</label>
            <input type="file" accept="image/*" className="input" onChange={e=>setBannerFile(e.target.files[0])} />
            <span className="helper-text">This image appears at the top of the public form, like a Google Forms header.</span>
            {br.banner_url && <img className="banner-preview" src={br.banner_url} alt="form header banner" />}
          </div>

          <button className="btn btn-primary btn-sm" onClick={saveBranding} disabled={saving}>
            {saving ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      )}

      {/* Account */}
      {tab === 'account' && (
        <div className="settings-section card">
          <h3>Change Password</h3>
          <div className="field-group">
            <label className="label">Current Password</label>
            <input type="password" className="input" value={cpCur} onChange={e=>setCpCur(e.target.value)} placeholder="Enter current password" />
          </div>
          <div className="field-group">
            <label className="label">New Password</label>
            <input type="password" className="input" value={cpNew} onChange={e=>setCpNew(e.target.value)} placeholder="Min 4 characters" />
          </div>
          <div className="field-group">
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" value={cpConf} onChange={e=>setCpConf(e.target.value)} placeholder="Repeat new password" />
          </div>
          <button className="btn btn-primary btn-sm" onClick={changePassword} disabled={saving}>
            {saving ? 'Updating…' : 'Change Password'}
          </button>
        </div>
      )}

      {/* Share */}
      {tab === 'share' && (
        <div className="settings-section card">
          <h3>Share Your Form</h3>
          <p className="settings-desc">Anyone with this link can fill out your form.</p>
          <div className="share-link-row">
            <span className="share-link-text">{formLink}</span>
            <button className="btn btn-primary btn-sm" onClick={copyLink}>Copy</button>
          </div>
          <a className="btn btn-outline btn-sm" href={formLink} target="_blank" rel="noreferrer">
            Open Form Preview ↗
          </a>
          <div className="share-tips">
            <h4>Share Tips</h4>
            <ul>
              <li>Send the public link on WhatsApp, Telegram, email, or Classroom.</li>
              <li>Use the QR button in the top toolbar for posters or offline sharing.</li>
              <li>Use the Embed button to paste the form inside a website.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
