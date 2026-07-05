import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { evaluate } from 'mathjs'
import toast from 'react-hot-toast'
import { analyticsAPI, formsAPI, responsesAPI } from '../services/api'
import './PublicForm.css'

const getFingerprint = () => {
  const key = 'fc_browser_fingerprint'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem(key, id)
  }
  return btoa([id, navigator.userAgent, screen.width, screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone].join('|'))
}

const sha256 = async text => {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buffer)).map(x => x.toString(16).padStart(2, '0')).join('')
}

export default function PublicFormPage() {
  const { slug } = useParams()
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState('loading')
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [steps, setSteps] = useState([])
  const [step, setStep] = useState(0)
  const [values, setValues] = useState({})
  const [fileIds, setFileIds] = useState({})
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const startTime = useRef(Date.now())
  const sessionId = useRef(null)

  useEffect(() => {
    if (!slug) {
      setStatus('error')
      return
    }

    formsAPI.getPublic(slug).then(r => {
      const nextForm = r.data
      setForm(nextForm)
      if (!nextForm.settings.accept_responses) {
        setStatus('closed')
        return
      }
      analyticsAPI.recordView({ form_slug: slug }).catch(() => {})
      setSteps(buildSteps(nextForm.fields_json || []))
      setStatus(nextForm.settings.is_password_protected ? 'pw' : 'active')
    }).catch(() => setStatus('error'))
  }, [slug])

  useEffect(() => {
    if (status !== 'active' || !slug) return
    responsesAPI.trackSession({
      form_slug: slug,
      session_id: sessionId.current || undefined,
      status: 'started',
      last_step: step,
      last_field_id: '',
    }).then(r => {
      if (!sessionId.current) sessionId.current = r.data.session_id
    }).catch(() => {})
  }, [step, status, slug])

  const buildSteps = fields => {
    const output = []
    let current = []
    for (const field of fields) {
      if (field.type === 'section' && field.startsNewStep && current.length) {
        output.push(current)
        current = [field]
      } else {
        current.push(field)
      }
    }
    if (current.length) output.push(current)
    return output.length ? output : [fields]
  }

  const checkPw = async () => {
    const hash = await sha256(pwInput)
    if (hash === form.settings.password_hash) {
      setStatus('active')
    } else {
      setPwError('Incorrect password.')
    }
  }

  const isVisible = field => {
    if (!field.condition) return true
    const { dependsOn, operator, value } = field.condition
    const actual = String(values[dependsOn] || '')
    if (operator === 'equals') return actual === value
    if (operator === 'not_equals') return actual !== value
    if (operator === 'contains') return actual.includes(value)
    return true
  }

  const calcValue = field => {
    if (field.type !== 'calculated' || !field.formula) return ''
    try {
      let expr = field.formula
      for (const item of (form?.fields_json || [])) {
        expr = expr.replaceAll(`{{${item.id}}}`, parseFloat(values[item.id]) || 0)
      }
      const result = evaluate(expr)
      return isNaN(result) ? '' : String(Math.round(result * 100) / 100)
    } catch {
      return ''
    }
  }

  const setValue = (id, val) => {
    setValues(prev => ({ ...prev, [id]: val }))
    setErrors(prev => ({ ...prev, [id]: '' }))
  }

  const uploadFile = async (fieldId, file) => {
    const fd = new FormData()
    fd.append('form_slug', slug)
    fd.append('field_id', fieldId)
    fd.append('file', file)

    try {
      const r = await responsesAPI.uploadFile(fd)
      setFileIds(prev => ({ ...prev, [fieldId]: r.data.file_id }))
      setValue(fieldId, r.data.filename)
      toast.success('File uploaded')
    } catch {
      toast.error('File upload failed')
    }
  }

  const validateStep = () => {
    const nextErrors = {}
    for (const field of (steps[step] || [])) {
      if (!isVisible(field) || field.type === 'section' || field.type === 'calculated' || !field.required) continue
      const value = values[field.id]
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
        nextErrors[field.id] = 'This field is required'
      }
    }
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }

  const nextStep = () => {
    if (!validateStep()) {
      toast.error('Please fill all required fields')
      return
    }
    if (step < steps.length - 1) {
      setStep(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    handleSubmit()
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const finalData = { ...values }
    for (const field of (form?.fields_json || [])) {
      if (field.type === 'calculated') finalData[field.id] = calcValue(field)
    }

    try {
      const r = await responsesAPI.submit({
        form_slug: slug,
        data: finalData,
        fingerprint: getFingerprint(),
        time_to_complete: Math.round((Date.now() - startTime.current) / 1000),
        file_ids: fileIds,
      })

      if (sessionId.current) {
        responsesAPI.trackSession({
          form_slug: slug,
          session_id: sessionId.current,
          status: 'completed',
          last_step: step,
          last_field_id: '',
        }).catch(() => {})
      }

      setStatus('submitted')
      if (r.data.redirect_url) setTimeout(() => { window.location.href = r.data.redirect_url }, 2000)
    } catch (err) {
      const msg = err.response?.data?.error || 'Submission failed. Please try again.'
      toast.error(msg)
      if (err.response?.status === 409) setStatus('duplicate')
    } finally {
      setSubmitting(false)
    }
  }

  const br = form?.branding || {}
  const pc = br.primary_color || '#673ab7'
  const canSubmitAgain = form?.settings?.submission_limit_mode === 'unlimited'
  const cssVars = { '--pc': pc, '--bg': br.bg_color || '#f6f7fb', fontFamily: `'${br.font || 'Inter'}', sans-serif` }

  if (status === 'loading') return <div className="pf-page" style={cssVars}><div className="pf-center"><div className="pf-spin" /></div></div>
  if (status === 'error') return <StateCard cssVars={cssVars} pc={pc} icon="alert" title="Form not found" msg="This form link does not exist or has been removed." />
  if (status === 'closed') return <StateCard cssVars={cssVars} pc={pc} icon="lock" title="Form closed" msg={form?.settings?.closed_reason || 'This form is no longer accepting responses.'} />
  if (status === 'duplicate') return <StateCard cssVars={cssVars} pc={pc} icon="done" title="Already submitted" msg="This form is limited to one response for you." />

  if (status === 'submitted') {
    return (
      <div className="pf-page" style={cssVars}>
        <PfNav pc={pc} />
        <div className="pf-center">
          <div className="pf-state">
            <StatusIcon pc={pc} type="done" />
            <h2>Response recorded</h2>
            <p>{form.settings?.confirmation_message || 'Your response has been submitted successfully.'}</p>
            {canSubmitAgain && (
              <button className="pf-btn" style={{ background: pc }} onClick={() => { setValues({}); setFileIds({}); setStep(0); setStatus('active') }}>
                Submit another
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'pw') {
    return (
      <div className="pf-page" style={cssVars}>
        <PfNav pc={pc} />
        <div className="pf-center">
          <div className="pf-state">
            <StatusIcon pc={pc} type="lock" />
            <h2>Password required</h2>
            <p>This form is protected. Enter the password to continue.</p>
            <div className="pf-password-row">
              <input className="pf-input" type="password" value={pwInput} onChange={e => { setPwInput(e.target.value); setPwError('') }} onKeyDown={e => e.key === 'Enter' && checkPw()} placeholder="Enter password" />
              <button className="pf-btn" style={{ background: pc }} onClick={checkPw}>Unlock</button>
            </div>
            {pwError && <span className="pf-field-error">{pwError}</span>}
          </div>
        </div>
      </div>
    )
  }

  const curFields = steps[step] || []
  const isLast = step === steps.length - 1
  const isMulti = steps.length > 1
  const progress = isMulti ? Math.round(((step + 1) / steps.length) * 100) : null

  return (
    <div className="pf-page" style={cssVars}>
      <PfNav pc={pc} />
      <main className="pf-main">
        <div className="pf-header">
          {br.banner_url && <img className="pf-banner" src={br.banner_url} alt="" />}
          <div className="pf-accent" style={{ background: pc }} />
          <h1 className="pf-title">{form.title}</h1>
          {form.description && <p className="pf-desc">{form.description}</p>}
          {isMulti && (
            <div className="pf-progress">
              <div className="pf-prog-bar"><div className="pf-prog-fill" style={{ width: `${progress}%`, background: pc }} /></div>
              <span>Step {step + 1} of {steps.length}</span>
            </div>
          )}
          <p className="pf-req-note"><span style={{ color: pc }}>*</span> Required question</p>
        </div>

        {curFields.map(field => isVisible(field) ? (
          <PfField key={field.id} field={field} value={values[field.id]} calcVal={calcValue(field)} error={errors[field.id]} onChange={value => setValue(field.id, value)} onFile={file => uploadFile(field.id, file)} pc={pc} />
        ) : null)}

        <div className="pf-actions">
          {isMulti && step > 0 && <button className="pf-btn pf-ghost" onClick={() => { setStep(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Back</button>}
          <button className="pf-btn" style={{ background: pc }} onClick={nextStep} disabled={submitting}>
            {submitting ? <><div className="pf-spin-sm" />Submitting...</> : isLast ? 'Submit' : 'Next'}
          </button>
          {!isMulti && <button className="pf-btn pf-ghost" onClick={() => setValues({})}>Clear form</button>}
        </div>
      </main>
      <footer className="pf-footer">Powered by <strong>FormCraft</strong></footer>
    </div>
  )
}

function StateCard({ cssVars, pc, icon, title, msg }) {
  return (
    <div className="pf-page" style={cssVars}>
      <PfNav pc={pc} />
      <div className="pf-center">
        <div className="pf-state">
          <StatusIcon pc={pc} type={icon} />
          <h2>{title}</h2>
          <p>{msg}</p>
        </div>
      </div>
    </div>
  )
}

function StatusIcon({ pc, type }) {
  const paths = {
    done: <path d="M20 6 9 17l-5-5" />,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    alert: <><path d="M12 8v5" /><path d="M12 17h.01" /></>,
  }
  return (
    <div className="pf-status-icon" style={{ background: `${pc}14`, color: pc }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        {paths[type] || paths.alert}
      </svg>
    </div>
  )
}

function PfNav({ pc }) {
  return (
    <nav className="pf-nav">
      <a href="/" className="pf-brand">
        <div className="pf-brand-icon" style={{ background: pc }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><line x1="12" y1="6" x2="12" y2="14" /><line x1="8" y1="10" x2="16" y2="10" /></svg>
        </div>
        <span>FormCraft</span>
      </a>
    </nav>
  )
}

function PfField({ field, value, calcVal, error, onChange, onFile, pc }) {
  if (field.type === 'section') return <div className="pf-section"><h2>{field.label}</h2></div>
  if (field.type === 'calculated') {
    return field.visible === false ? null : (
      <div className="pf-field">
        <div className="pf-label">{field.label}</div>
        <div className="pf-calc">{calcVal || '-'}</div>
        <div className="pf-helper">Auto-calculated</div>
      </div>
    )
  }

  return (
    <div className="pf-field" style={{ '--pc': pc }}>
      <label className="pf-label">{field.label}{field.required && <span className="pf-star" style={{ color: pc }}>*</span>}</label>

      {['text', 'email', 'tel', 'number'].includes(field.type) && <input className={`pf-input ${error ? 'pf-err' : ''}`} type={field.type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} />}
      {field.type === 'date' && <input className={`pf-input ${error ? 'pf-err' : ''}`} type="date" value={value || ''} onChange={e => onChange(e.target.value)} />}
      {field.type === 'textarea' && <textarea className={`pf-input pf-ta ${error ? 'pf-err' : ''}`} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={4} />}
      {field.type === 'select' && (
        <select className={`pf-select ${error ? 'pf-err' : ''}`} value={value || ''} onChange={e => onChange(e.target.value)}>
          <option value="">Select an option</option>
          {(field.options || []).map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      )}
      {field.type === 'radio' && (
        <div className="pf-opts">
          {(field.options || []).map(option => (
            <label key={option} className={`pf-opt ${value === option ? 'sel' : ''}`} style={value === option ? { borderColor: pc, background: `${pc}10` } : {}}>
              <input type="radio" name={field.id} value={option} checked={value === option} onChange={() => onChange(option)} />
              <span className="pf-radio-dot" style={value === option ? { background: pc, borderColor: pc } : {}} />
              {option}
            </label>
          ))}
        </div>
      )}
      {field.type === 'checkbox' && (
        <div className="pf-opts">
          {(field.options || []).map(option => {
            const checked = Array.isArray(value) ? value.includes(option) : false
            const toggle = () => {
              const current = Array.isArray(value) ? value : []
              onChange(checked ? current.filter(item => item !== option) : [...current, option])
            }
            return (
              <label key={option} className={`pf-opt ${checked ? 'sel' : ''}`} style={checked ? { borderColor: pc, background: `${pc}10` } : {}}>
                <input type="checkbox" checked={checked} onChange={toggle} />
                <span className="pf-check" style={checked ? { background: pc, borderColor: pc } : {}}>{checked && <svg width="10" height="10" viewBox="0 0 12 12"><polyline points="2 6 5 9 10 3" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>}</span>
                {option}
              </label>
            )
          })}
        </div>
      )}
      {field.type === 'file' && (
        <div className={`pf-file ${error ? 'pf-err' : ''}`}>
          <input type="file" id={`f_${field.id}`} onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]) }} />
          <label htmlFor={`f_${field.id}`} className="pf-file-label">
            {value ? <span style={{ color: pc }}>{value}</span> : 'Click to upload file'}
          </label>
        </div>
      )}
      {error && <span className="pf-field-error">{error}</span>}
    </div>
  )
}
