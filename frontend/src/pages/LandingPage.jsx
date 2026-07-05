import { Link } from 'react-router-dom'
import './Landing.css'

const FEATURES = [
  { icon:'🏗️', c:'#7c3aed', title:'Drag & Drop Builder',   desc:'10+ field types. Reorder questions visually in seconds.' },
  { icon:'📋', c:'#06b6d4', title:'Multiple Forms',         desc:'Create unlimited forms — each with its own unique link.' },
  { icon:'🔗', c:'#22c55e', title:'Shareable Links + QR',   desc:'Share via link or QR code. Works on WhatsApp, email, anywhere.' },
  { icon:'📊', c:'#f59e0b', title:'Live Analytics',         desc:'Views, submissions, conversion rates, question breakdown.' },
  { icon:'📥', c:'#ec4899', title:'Excel Export',           desc:'Download all responses as formatted .xlsx with one click.' },
  { icon:'🎨', c:'#8b5cf6', title:'Custom Branding',        desc:'Colors, fonts, logo, banners — fully customisable per form.' },
  { icon:'📧', c:'#ef4444', title:'Email Notifications',    desc:'Get notified by email every time someone submits your form.' },
  { icon:'🛡️', c:'#14b8a6', title:'Spam & Duplicate Guard', desc:'Browser fingerprint, email dedup, honeypot — all built-in.' },
  { icon:'🔐', c:'#f97316', title:'Password Protection',    desc:'Lock a form behind a password for private submissions.' },
  { icon:'🧮', c:'#a855f7', title:'Calculated Fields',      desc:'Auto-compute totals, scores, or any formula in real time.' },
  { icon:'🧩', c:'#06b6d4', title:'Conditional Logic',      desc:'Show or hide fields based on previous answers.' },
  { icon:'📁', c:'#22c55e', title:'File Uploads',           desc:'Accept resumes, photos, or any document via your form.' },
]

const STEPS = [
  { n:'1', title:'Create Account', desc:'Register as admin in under 30 seconds.' },
  { n:'2', title:'Build Your Form', desc:'Pick a template or start blank. Drag & drop.' },
  { n:'3', title:'Share & Collect', desc:'Share link or QR. Responses come in live.' },
]

export default function LandingPage() {
  return (
    <div className="page">
      <div className="bg-decoration"><div className="bg-blob blob-1"/><div className="bg-blob blob-2"/><div className="bg-blob blob-3"/></div>

      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div className="brand-icon"><BrandSvg /></div>
          <span>FormCraft</span>
        </Link>
        <div className="nav-links">
          <Link to="/login"    className="btn btn-ghost  btn-sm">Login</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      <main className="lp-main">
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-badge">✨ The Google Forms Alternative</div>
          <h1 className="lp-title">Build <span className="gradient-text">Professional</span><br className="hide-mobile" /> Forms That Convert</h1>
          <p className="lp-sub">Create stunning forms in minutes. Share a link or QR code, collect responses, get email alerts, and export to Excel — all from one beautiful dashboard.</p>
          <div className="lp-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Create Your First Form
            </Link>
            <Link to="/login" className="btn btn-outline btn-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
              Admin Login
            </Link>
          </div>
          <div className="lp-stats">
            {[['12+','Field Types'],['8','Templates'],['100%','Free']].map(([v,l])=>(
              <div className="lp-stat" key={l}><strong>{v}</strong><span>{l}</span></div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="lp-section">
          <div className="lp-section-hd"><h2>Everything you need</h2><p>Built for students, educators, and businesses.</p></div>
          <div className="lp-features-grid">
            {FEATURES.map(f=>(
              <div className="lp-feat card card-hover" key={f.title}>
                <div className="lp-feat-icon" style={{background:`${f.c}22`,color:f.c}}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Steps */}
        <section className="lp-section">
          <div className="lp-section-hd"><h2>How it works</h2><p>From zero to first response in under 3 minutes.</p></div>
          <div className="lp-steps">
            {STEPS.map((s,i)=>(
              <div className="lp-step-wrap" key={s.n}>
                <div className="lp-step card">
                  <div className="lp-step-num">{s.n}</div>
                  <h3>{s.title}</h3><p>{s.desc}</p>
                </div>
                {i < STEPS.length-1 && <div className="lp-arrow">→</div>}
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-section">
          <div className="lp-cta-card card">
            <h2>Ready to replace Google Forms?</h2>
            <p>Start building for free — no limits, no hidden charges.</p>
            <Link to="/register" className="btn btn-primary btn-lg">Get Started — It's Free</Link>
          </div>
        </section>
      </main>

      <footer className="footer">FormCraft — Professional Form Builder &copy; {new Date().getFullYear()}</footer>
    </div>
  )
}

function BrandSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      <line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/>
    </svg>
  )
}
