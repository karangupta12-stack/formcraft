import { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import { analyticsAPI } from '../../services/api'
import toast from 'react-hot-toast'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler } from 'chart.js'
import './AnalyticsPanel.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler)

const OPTS = { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{ticks:{color:'#6b7280',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'}},y:{ticks:{color:'#6b7280',font:{size:10}},grid:{color:'rgba(255,255,255,0.04)'},beginAtZero:true}} }

const fmt = s => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`

export default function AnalyticsPanel({ formSlug }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    analyticsAPI.getSummary(formSlug)
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [formSlug])

  const resetViews = async () => {
    if (!window.confirm('Reset view counter?')) return
    await analyticsAPI.resetViews(formSlug)
    toast.success('Views reset'); load()
  }

  if (loading) return <div className="ap-loading"><svg className="spinner" viewBox="0 0 24 24" width="36" height="36"><circle cx="12" cy="12" r="10" fill="none" stroke="var(--primary)" strokeWidth="3" strokeDasharray="30 70" strokeLinecap="round"/></svg></div>
  if (!data) return null

  const metrics = [
    {label:'Total Views',          val:data.views},
    {label:'Total Submissions',    val:data.submissions},
    {label:'Submissions Today',    val:data.today_submissions},
    {label:'Conversion Rate',      val:`${data.conversion_rate}%`},
    {label:'Completion Rate',      val:`${data.completion_rate}%`},
    {label:'Abandonment Rate',     val:`${data.abandonment_rate}%`},
    {label:'Avg Completion Time',  val:data.avg_seconds ? fmt(data.avg_seconds) : '—'},
    {label:'Started, Not Submitted',val:data.started_not_submitted},
  ]

  const lineData = {
    labels: data.chart.labels,
    datasets:[{data:data.chart.counts, borderColor:'#a78bfa', backgroundColor:'rgba(124,58,237,0.1)', fill:true, tension:0.4, pointRadius:2, pointBackgroundColor:'#a78bfa'}]
  }

  return (
    <div className="ap-wrap">
      <div className="ap-toolbar">
        <h2>Analytics</h2>
        <div style={{display:'flex',gap:'0.5rem'}}>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
          <button className="btn btn-ghost btn-sm" onClick={resetViews}>Reset Views</button>
        </div>
      </div>

      <div className="ap-metrics">
        {metrics.map(m=>(
          <div className="ap-metric card" key={m.label}>
            <span className="ap-metric-label">{m.label}</span>
            <strong className="ap-metric-val">{m.val}</strong>
          </div>
        ))}
      </div>

      <div className="card ap-chart-card">
        <h3>Submissions — Last 30 Days</h3>
        <div style={{height:200,marginTop:'1rem'}}>
          <Line data={lineData} options={OPTS} />
        </div>
      </div>

      <div className="card ap-compare">
        <h3>Views vs Submissions</h3>
        {[['Views',data.views],['Submissions',data.submissions]].map(([l,v])=>{
          const max = Math.max(data.views, data.submissions, 1)
          return (
            <div className="ap-bar-row" key={l}>
              <span>{l}</span>
              <div className="ap-bar-bg"><div className="ap-bar-fill" style={{width:`${(v/max)*100}%`}} /></div>
              <strong>{v}</strong>
            </div>
          )
        })}
      </div>

      {data.question_stats?.length > 0 && (
        <div className="ap-questions">
          <h3>Question Breakdown</h3>
          <div className="ap-q-grid">
            {data.question_stats.map(q=>{
              const bd = { labels:Object.keys(q.counts), datasets:[{data:Object.values(q.counts), backgroundColor:'rgba(167,139,250,0.7)', borderRadius:5}] }
              return (
                <div className="card ap-q-card" key={q.field_id}>
                  <h4>{q.label}</h4>
                  <div style={{height:150,marginTop:'0.75rem'}}><Bar data={bd} options={{...OPTS,indexAxis:'y'}} /></div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
