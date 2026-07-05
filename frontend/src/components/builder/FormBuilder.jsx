import { useEffect, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import FieldModal from './FieldModal'
import TemplatesModal from './TemplatesModal'
import './FormBuilder.css'

const TYPE_LABEL = {
  text: 'Short Text',
  email: 'Email',
  tel: 'Phone',
  number: 'Number',
  textarea: 'Long Text',
  date: 'Date',
  select: 'Dropdown',
  radio: 'Multiple Choice',
  checkbox: 'Checkboxes',
  file: 'File Upload',
  section: 'Section',
  calculated: 'Calculated',
}

export default function FormBuilder({ form, onSave, saving, onDraftChange, onDirtyChange, initialDirty = false }) {
  const [title, setTitle] = useState(form.title)
  const [desc, setDesc] = useState(form.description)
  const [fields, setFields] = useState(form.fields_json || [])
  const [editing, setEditing] = useState(null)
  const [showFM, setShowFM] = useState(false)
  const [showTpl, setShowTpl] = useState(false)
  const [dirty, setDirty] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  useEffect(() => {
    setTitle(form.title)
    setDesc(form.description)
    setFields(form.fields_json || [])
    setDirty(initialDirty)
  }, [form.slug])

  useEffect(() => {
    onDraftChange?.({ title, description: desc, fields_json: fields })
  }, [title, desc, fields, onDraftChange])

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  const mark = () => setDirty(true)

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIndex = fields.findIndex(field => field.id === active.id)
    const newIndex = fields.findIndex(field => field.id === over.id)
    setFields(arrayMove(fields, oldIndex, newIndex))
    mark()
  }

  const handleFieldSave = fieldData => {
    setFields(prev => {
      if (editing) return prev.map(field => field.id === editing.id ? fieldData : field)
      return [...prev, { ...fieldData, id: `f_${Date.now()}` }]
    })
    setShowFM(false)
    setEditing(null)
    mark()
  }

  const deleteField = id => {
    if (!window.confirm('Remove this question?')) return
    setFields(prev => prev.filter(field => field.id !== id))
    mark()
  }

  const duplicateField = field => {
    const copy = { ...field, id: `f_${Date.now()}`, label: `${field.label} copy` }
    setFields(prev => {
      const index = prev.findIndex(item => item.id === field.id)
      const next = [...prev]
      next.splice(index + 1, 0, copy)
      return next
    })
    mark()
  }

  const useTemplate = template => {
    setTitle(template.title)
    setDesc(template.description)
    setFields(template.fields.map((field, index) => ({ ...field, id: field.id || `f_${Date.now()}_${index}` })))
    setShowTpl(false)
    mark()
    toast.success(`Template "${template.name}" loaded`)
  }

  const handleSave = async () => {
    const saved = await onSave({ title, description: desc, fields_json: fields })
    if (saved) setDirty(false)
  }

  return (
    <div className="form-builder">
      <div className="builder-toolbar">
        <button className="btn btn-ghost btn-sm" onClick={() => setShowTpl(true)}>Templates</button>
        <div className="tb-right">
          {dirty && <span className="unsaved-state"><span className="unsaved-dot" /> Unsaved changes</span>}
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="builder-meta card">
        <div className="meta-bar" />
        <input className="meta-title" value={title} onChange={e => { setTitle(e.target.value); mark() }} placeholder="Form title" />
        <textarea className="meta-desc" value={desc} onChange={e => { setDesc(e.target.value); mark() }} placeholder="Form description (optional)" rows={2} />
      </div>

      <div className="fields-list">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fields.map(field => field.id)} strategy={verticalListSortingStrategy}>
            {fields.map(field => (
              <SortableField
                key={field.id}
                field={field}
                onEdit={() => { setEditing(field); setShowFM(true) }}
                onDelete={() => deleteField(field.id)}
                onDuplicate={() => duplicateField(field)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {fields.length === 0 && (
          <div className="fields-empty">
            <div className="empty-icon">+</div>
            <h3>No questions yet</h3>
            <p>Add your first question or pick a template.</p>
          </div>
        )}
        <button className="btn-add-field" onClick={() => { setEditing(null); setShowFM(true) }}>
          <span>+</span> Add question
        </button>
      </div>

      {showFM && <FieldModal field={editing} existingFields={fields} onSave={handleFieldSave} onClose={() => setShowFM(false)} />}
      {showTpl && <TemplatesModal onUse={useTemplate} onClose={() => setShowTpl(false)} />}
    </div>
  )
}

function SortableField({ field, onEdit, onDelete, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.55 : 1 }

  return (
    <div ref={setNodeRef} style={style} className={`field-row card ${isDragging ? 'dragging' : ''}`}>
      <button className="field-drag" {...attributes} {...listeners} title="Drag to reorder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
        </svg>
      </button>
      <div className="field-info">
        {field.type === 'section'
          ? <span className="field-section">{field.label}</span>
          : <><span className="field-label-txt">{field.label}</span>{field.required && <span className="required-star">*</span>}</>
        }
        <span className="field-type-tag">{TYPE_LABEL[field.type] || field.type}</span>
      </div>
      <div className="field-acts">
        <button className="btn btn-ghost btn-sm" onClick={onDuplicate} title="Duplicate">Copy</button>
        <button className="btn btn-ghost btn-sm" onClick={onEdit} title="Edit">Edit</button>
        <button className="btn btn-ghost btn-sm danger-btn" onClick={onDelete} title="Delete">Delete</button>
      </div>
    </div>
  )
}
