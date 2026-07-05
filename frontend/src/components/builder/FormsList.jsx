import './FormsList.css'

export default function FormsList({ forms, loading, onSelect, onCreate, onDelete, onDuplicate }) {
  if (loading) return (
    <div className="fl-loading">
      <svg className="spinner" viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg>
    </div>
  )

  return (
    <div className="fl-wrap">
      <div className="fl-header">
        <h2>My Forms</h2>
        <p>{forms.length} form{forms.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="fl-grid">
        {/* Create card */}
        <button className="fl-create-card" onClick={onCreate}>
          <div className="fl-create-icon">+</div>
          <span>Create New Form</span>
        </button>

        {forms.map(f => (
          <div key={f.slug} className="fl-card card card-hover" onClick={() => onSelect(f)}>
            <div className="fl-card-top">
              <div className="fl-card-icon">📋</div>
              <div className={`fl-status-dot ${f.status}`} title={f.status} />
            </div>
            <h3 className="fl-card-title">{f.title}</h3>
            <p className="fl-card-desc">{f.description || 'No description'}</p>
            <div className="fl-card-meta">
              <span>{f.response_count} response{f.response_count !== 1 ? 's' : ''}</span>
              <span>{new Date(f.created_at).toLocaleDateString()}</span>
            </div>
            <div className="fl-card-actions" onClick={e => e.stopPropagation()}>
              <button className="btn btn-ghost btn-sm" onClick={() => onSelect(f)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => onDuplicate(f.slug)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy
              </button>
              <button className="btn btn-ghost btn-sm danger" onClick={() => onDelete(f.slug)}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
