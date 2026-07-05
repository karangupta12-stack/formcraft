import { useState } from 'react'
import './FieldModal.css'

const TYPES = [
  {value:'text',label:'Short Text'},{value:'email',label:'Email'},{value:'tel',label:'Phone'},
  {value:'number',label:'Number'},{value:'textarea',label:'Long Text'},{value:'date',label:'Date'},
  {value:'select',label:'Dropdown'},{value:'radio',label:'Multiple Choice'},
  {value:'checkbox',label:'Checkboxes'},{value:'file',label:'File Upload'},
  {value:'section',label:'Section Header'},{value:'calculated',label:'Calculated Field'},
]

export default function FieldModal({ field, existingFields, onSave, onClose }) {
  const isEdit = Boolean(field)
  const [type,       setType]       = useState(field?.type || 'text')
  const [label,      setLabel]      = useState(field?.label || '')
  const [placeholder,setPlaceholder]= useState(field?.placeholder || '')
  const [required,   setRequired]   = useState(field?.required ?? true)
  const [options,    setOptions]    = useState(field?.options?.length ? field.options : [''])
  const [formula,    setFormula]    = useState(field?.formula || '')
  const [calcVis,    setCalcVis]    = useState(field?.visible ?? true)
  const [startsStep, setStartsStep] = useState(field?.startsNewStep ?? false)
  const [condition,  setCondition]  = useState(field?.condition || null)
  const [errors,     setErrors]     = useState({})

  const hasOpts = ['select','radio','checkbox'].includes(type)
  const isSection = type === 'section'
  const isCalc    = type === 'calculated'
  const numFields = existingFields.filter(f => f.type === 'number' && f.id !== field?.id)

  const validate = () => {
    const e = {}
    if (!label.trim()) e.label = 'Label is required'
    if (isCalc && !formula.trim()) e.formula = 'Formula is required'
    if (hasOpts && !options.filter(o=>o.trim()).length) e.options = 'Add at least one option'
    setErrors(e); return !Object.keys(e).length
  }

  const handleSave = () => {
    if (!validate()) return
    const d = { id:field?.id||'', label:label.trim(), type, placeholder:isSection||isCalc?'':placeholder.trim(), required:isSection||isCalc?false:required, options:hasOpts?options.filter(o=>o.trim()):[] }
    if (isSection) d.startsNewStep = startsStep
    if (isCalc)    { d.formula=formula.trim(); d.visible=calcVis }
    if (condition) d.condition = condition
    onSave(d)
  }

  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box card">
        <div className="modal-header">
          <h2>{isEdit?'Edit Question':'Add Question'}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="field-group">
            <label className="label">Field Type</label>
            <select className="select" value={type} onChange={e=>setType(e.target.value)}>
              {TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label className="label">Question Label <span className="required-star">*</span></label>
            <input className={`input ${errors.label?'error':''}`} value={label} onChange={e=>setLabel(e.target.value)} placeholder="e.g. Full Name" />
            {errors.label && <span className="field-error">⚠ {errors.label}</span>}
          </div>
          {!isSection && !isCalc && (
            <div className="field-group">
              <label className="label">Placeholder Text</label>
              <input className="input" value={placeholder} onChange={e=>setPlaceholder(e.target.value)} placeholder="Optional hint" />
            </div>
          )}
          {hasOpts && (
            <div className="field-group">
              <label className="label">Options <span className="required-star">*</span></label>
              <div className="options-list">
                {options.map((o,i)=>(
                  <div key={i} className="option-row">
                    <input className="input" value={o} onChange={e=>setOptions(p=>p.map((x,j)=>j===i?e.target.value:x))} placeholder={`Option ${i+1}`} />
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>setOptions(p=>p.filter((_,j)=>j!==i))} disabled={options.length===1}>✕</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setOptions(p=>[...p,''])}>+ Add Option</button>
              {errors.options && <span className="field-error">⚠ {errors.options}</span>}
            </div>
          )}
          {isCalc && (
            <div className="field-group">
              <label className="label">Formula <span className="required-star">*</span></label>
              <input className={`input ${errors.formula?'error':''}`} value={formula} onChange={e=>setFormula(e.target.value)} placeholder="e.g. {{price}} * {{qty}}" />
              <span className="helper-text">Use {"{{field_id}}"} to reference numeric fields.</span>
              {numFields.length>0 && <div className="chips">{numFields.map(f=><button key={f.id} className="chip" onClick={()=>setFormula(x=>x+`{{${f.id}}}`)}>+{`{{${f.id}}}`}</button>)}</div>}
              {errors.formula && <span className="field-error">⚠ {errors.formula}</span>}
              <label className="toggle-row"><input type="checkbox" checked={calcVis} onChange={e=>setCalcVis(e.target.checked)} />Show value to respondent</label>
            </div>
          )}
          {isSection && <label className="toggle-row"><input type="checkbox" checked={startsStep} onChange={e=>setStartsStep(e.target.checked)} />Start new wizard step here</label>}
          {!isSection && !isCalc && <label className="toggle-row"><input type="checkbox" checked={required} onChange={e=>setRequired(e.target.checked)} />Required field</label>}
          <div className="field-group">
            <label className="toggle-row">
              <input type="checkbox" checked={Boolean(condition)} onChange={e=>setCondition(e.target.checked?{dependsOn:'',operator:'equals',value:''}:null)} />
              Conditional logic
            </label>
            {condition && (
              <div className="logic-row">
                <select className="select" value={condition.dependsOn} onChange={e=>setCondition(c=>({...c,dependsOn:e.target.value}))}>
                  <option value="">— Select field —</option>
                  {existingFields.filter(f=>f.id!==field?.id&&!['section','calculated'].includes(f.type)).map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <select className="select" value={condition.operator} onChange={e=>setCondition(c=>({...c,operator:e.target.value}))}>
                  <option value="equals">equals</option><option value="not_equals">not equals</option><option value="contains">contains</option>
                </select>
                <input className="input" value={condition.value} onChange={e=>setCondition(c=>({...c,value:e.target.value}))} placeholder="Value" />
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit?'Update':'Add Question'}</button>
        </div>
      </div>
    </div>
  )
}
