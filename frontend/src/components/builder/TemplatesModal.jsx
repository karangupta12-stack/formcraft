import { useState } from 'react'
const TEMPLATES = [
  { id:'student-reg',  name:'Student Registration', icon:'🎓', title:'Student Registration', description:'Collect student details and course preferences.',
    fields:[{id:'full_name',label:'Student Full Name',type:'text',placeholder:'Enter name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'student@example.com',required:true,options:[]},{id:'dob',label:'Date of Birth',type:'date',placeholder:'',required:true,options:[]},{id:'course',label:'Course Applying For',type:'select',placeholder:'',required:true,options:['B.Tech','B.Sc','BBA','MBA','M.Tech']},{id:'guardian',label:'Guardian Name',type:'text',placeholder:'Parent or guardian name',required:true,options:[]},{id:'phone',label:'Contact Number',type:'tel',placeholder:'+91 98765 43210',required:true,options:[]},{id:'address',label:'Address',type:'textarea',placeholder:'Street, city, state, PIN',required:true,options:[]}]},
  { id:'contact',      name:'Contact Us',           icon:'💬', title:'Contact Us',           description:'Simple contact form for inquiries.',
    fields:[{id:'name',label:'Full Name',type:'text',placeholder:'Enter your name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'you@example.com',required:true,options:[]},{id:'phone',label:'Phone Number',type:'tel',placeholder:'+91 98765 43210',required:false,options:[]},{id:'reason',label:'Reason for Contact',type:'select',placeholder:'',required:true,options:['General question','Support','Sales','Partnership','Other']},{id:'message',label:'Message',type:'textarea',placeholder:'How can we help?',required:true,options:[]}]},
  { id:'event-rsvp',   name:'Event RSVP',            icon:'📅', title:'Event RSVP',            description:'Confirm attendance and collect preferences.',
    fields:[{id:'name',label:'Guest Name',type:'text',placeholder:'Enter your name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'you@example.com',required:true,options:[]},{id:'attending',label:'Will you attend?',type:'radio',placeholder:'',required:true,options:['Yes','No','Maybe']},{id:'guests',label:'Additional Guests',type:'number',placeholder:'0',required:false,options:[]},{id:'meal',label:'Meal Preference',type:'select',placeholder:'',required:false,options:['Vegetarian','Vegan','Chicken','Fish','No meal']},{id:'notes',label:'Notes',type:'textarea',placeholder:'Anything we should know?',required:false,options:[]}]},
  { id:'job-app',      name:'Job Application',       icon:'💼', title:'Job Application',       description:'Collect applicant details and role preferences.',
    fields:[{id:'name',label:'Full Name',type:'text',placeholder:'Enter your full name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'candidate@example.com',required:true,options:[]},{id:'phone',label:'Phone Number',type:'tel',placeholder:'+91 98765 43210',required:true,options:[]},{id:'role',label:'Position Applied For',type:'select',placeholder:'',required:true,options:['Frontend Developer','Backend Developer','Designer','Product Manager']},{id:'experience',label:'Years of Experience',type:'number',placeholder:'3',required:true,options:[]},{id:'resume',label:'Upload Resume',type:'file',placeholder:'',required:true,options:[]},{id:'cover',label:'Cover Letter',type:'textarea',placeholder:'Tell us why you are a strong fit',required:false,options:[]}]},
  { id:'feedback',     name:'Customer Feedback',     icon:'⭐', title:'Customer Feedback',     description:'Measure satisfaction and collect feedback.',
    fields:[{id:'name',label:'Name',type:'text',placeholder:'Optional',required:false,options:[]},{id:'rating',label:'Overall Rating',type:'radio',placeholder:'',required:true,options:['Excellent','Good','Average','Poor']},{id:'recommend',label:'How likely to recommend us?',type:'select',placeholder:'',required:true,options:['Very likely','Likely','Neutral','Unlikely']},{id:'liked',label:'What did you like most?',type:'textarea',placeholder:'Share the highlights',required:false,options:[]},{id:'improve',label:'What can we improve?',type:'textarea',placeholder:'Your suggestions',required:false,options:[]}]},
  { id:'quiz',         name:'Quiz / Test',            icon:'📝', title:'Knowledge Check',       description:'Scored quiz with calculated total.',
    fields:[{id:'name',label:'Student Name',type:'text',placeholder:'Enter your name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'student@example.com',required:true,options:[]},{id:'q1',label:'Score Q1 (0-10)',type:'number',placeholder:'0',required:true,options:[]},{id:'q2',label:'Score Q2 (0-10)',type:'number',placeholder:'0',required:true,options:[]},{id:'q3',label:'Score Q3 (0-10)',type:'number',placeholder:'0',required:true,options:[]},{id:'total_score',label:'Total Score',type:'calculated',placeholder:'',required:false,options:[],formula:'{{q1}} + {{q2}} + {{q3}}',visible:true}]},
  { id:'order',        name:'Product Order',          icon:'🛒', title:'Product Order',          description:'Capture orders and calculate totals.',
    fields:[{id:'name',label:'Customer Name',type:'text',placeholder:'Enter name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'customer@example.com',required:true,options:[]},{id:'product',label:'Product',type:'select',placeholder:'',required:true,options:['Starter Kit','Premium Kit','Gift Bundle']},{id:'unit_price',label:'Unit Price (₹)',type:'number',placeholder:'499',required:true,options:[]},{id:'quantity',label:'Quantity',type:'number',placeholder:'1',required:true,options:[]},{id:'total',label:'Order Total (₹)',type:'calculated',placeholder:'',required:false,options:[],formula:'{{unit_price}} * {{quantity}}',visible:true},{id:'shipping',label:'Shipping Address',type:'textarea',placeholder:'Street, city, PIN',required:true,options:[]}]},
  { id:'health',       name:'Health Intake',          icon:'🏥', title:'Health Intake Form',     description:'Patient contact and basic health history.',
    fields:[{id:'sec_p',label:'Personal Information',type:'section',placeholder:'',required:false,options:[],startsNewStep:false},{id:'name',label:'Patient Full Name',type:'text',placeholder:'Enter patient name',required:true,options:[]},{id:'email',label:'Email Address',type:'email',placeholder:'patient@example.com',required:true,options:[]},{id:'phone',label:'Phone Number',type:'tel',placeholder:'+91 98765 43210',required:true,options:[]},{id:'sec_h',label:'Health Details',type:'section',placeholder:'',required:false,options:[],startsNewStep:true},{id:'dob',label:'Date of Birth',type:'date',placeholder:'',required:true,options:[]},{id:'conditions',label:'Existing Conditions',type:'checkbox',placeholder:'',required:false,options:['Diabetes','Hypertension','Asthma','Heart condition','None']},{id:'medications',label:'Current Medications',type:'textarea',placeholder:'List or write none',required:true,options:[]},{id:'allergies',label:'Allergies',type:'textarea',placeholder:'List or write none',required:true,options:[]}]},
]
export default function TemplatesModal({ onUse, onClose }) {
  const [preview, setPreview] = useState(null)
  return (
    <div className="modal-backdrop" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box card" style={{maxWidth:720}}>
        <div className="modal-header"><h2>📄 Choose a Template</h2><button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>✕</button></div>
        <div style={{display:'flex',gap:'1rem',padding:'1rem',overflow:'hidden',maxHeight:'70vh'}}>
          <div style={{display:'flex',flexDirection:'column',gap:'0.4rem',width:200,flexShrink:0,overflowY:'auto'}}>
            {TEMPLATES.map(t=>(
              <button key={t.id} onClick={()=>setPreview(t)} style={{display:'flex',alignItems:'center',gap:'0.65rem',padding:'0.65rem 0.875rem',background:preview?.id===t.id?'rgba(124,58,237,0.12)':'none',border:preview?.id===t.id?'1px solid rgba(124,58,237,0.3)':'1px solid transparent',borderRadius:'var(--r)',cursor:'pointer',textAlign:'left',transition:'var(--t)'}}>
                <span style={{fontSize:'1.2rem'}}>{t.icon}</span>
                <div style={{overflow:'hidden'}}><div style={{fontSize:'0.82rem',fontWeight:600,color:'var(--text)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{t.name}</div><div style={{fontSize:'0.72rem',color:'var(--text3)'}}>{t.fields.length} fields</div></div>
              </button>
            ))}
          </div>
          {preview ? (
            <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              <div><h3 style={{fontSize:'1rem',fontWeight:700}}>{preview.icon} {preview.name}</h3><p style={{fontSize:'0.83rem',color:'var(--text2)',marginTop:'0.3rem'}}>{preview.description}</p></div>
              <div style={{display:'flex',flexDirection:'column',gap:'0.3rem',flex:1,overflowY:'auto'}}>
                {preview.fields.map(f=>(
                  <div key={f.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0.4rem 0.65rem',background:'var(--bg3)',borderRadius:'8px',fontSize:'0.8rem'}}>
                    <span>{f.label}</span><em style={{color:'var(--text3)',fontStyle:'normal',fontSize:'0.72rem'}}>{f.type}{f.required?' · req':''}</em>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" onClick={()=>onUse(preview)}>Use This Template</button>
            </div>
          ) : <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:'0.875rem'}}>Select a template to preview</div>}
        </div>
      </div>
    </div>
  )
}
