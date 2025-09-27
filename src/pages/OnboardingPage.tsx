import { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { generateUsername } from '../utils/generateUsername';

interface FormState {
  firstName: string;
  lastName: string;
  areas: string[];
  goals: string;
  experienceLevel: string;
  bio: string;
  location: string;
}

const AREA_OPTIONS = ['Gaming', 'Esports', 'Game Dev', 'Tech Conventions', 'Sports Analytics', 'Sports Performance', 'VR/AR', 'Web Dev'];
const EXPERIENCE_LEVELS = ['Student', 'Early Career', 'Mid Career', 'Senior', 'Leader'];

export default function OnboardingPage() {
  const { user, setUser } = useUserStore();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', areas: [], goals: '', experienceLevel: '', bio: '', location: ''
  });

  function toggleArea(area: string) {
    setForm(f => ({...f, areas: f.areas.includes(area) ? f.areas.filter(a => a!==area) : [...f.areas, area]}));
  }

  function next() { setStep(s => Math.min(s+1, steps.length-1)); }
  function prev() { setStep(s => Math.max(s-1, 0)); }

  function handleSubmit() {
    const username = generateUsername(form.firstName, form.lastName);
    setUser({
      id: crypto.randomUUID(),
      username,
      firstName: form.firstName,
      lastName: form.lastName,
      areas: form.areas,
      goals: form.goals,
      experienceLevel: form.experienceLevel,
      bio: form.bio,
      location: form.location,
      createdAt: new Date().toISOString()
    });
  }

  const steps = [
    <div key="s1">
      <h2>Basic Info</h2>
      <FormRow label="First Name"><input value={form.firstName} onChange={e=>setForm(f=>({...f, firstName:e.target.value}))} /></FormRow>
      <FormRow label="Last Name"><input value={form.lastName} onChange={e=>setForm(f=>({...f, lastName:e.target.value}))} /></FormRow>
      <FormRow label="Location"><input value={form.location} onChange={e=>setForm(f=>({...f, location:e.target.value}))} placeholder="City / Region" /></FormRow>
    </div>,
    <div key="s2">
      <h2>Focus Areas</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
        {AREA_OPTIONS.map(opt => (
          <button type="button" key={opt} onClick={()=>toggleArea(opt)} style={{
            background: form.areas.includes(opt)?'#ff9bd2':'#222a35',
            color: form.areas.includes(opt)?'#181a1f':'#d0d9e5'
          }}>{opt}</button>
        ))}
      </div>
    </div>,
    <div key="s3">
      <h2>Experience & Goals</h2>
      <FormRow label="Experience Level">
        <select value={form.experienceLevel} onChange={e=>setForm(f=>({...f, experienceLevel:e.target.value}))}>
          <option value="">Select...</option>
          {EXPERIENCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </FormRow>
      <FormRow label="Goals"><textarea rows={4} value={form.goals} onChange={e=>setForm(f=>({...f, goals:e.target.value}))} placeholder="What do you hope to achieve?" /></FormRow>
    </div>,
    <div key="s4">
      <h2>Bio</h2>
      <FormRow label="About You"><textarea rows={5} value={form.bio} onChange={e=>setForm(f=>({...f, bio:e.target.value}))} placeholder="Share your journey, wins, and what you want to learn." /></FormRow>
      <button onClick={handleSubmit} disabled={!form.firstName || !form.areas.length || !form.experienceLevel}>Finish & Create Profile</button>
    </div>
  ];

  if (user) {
    return <div className="card"><h2>You're onboarded 🎉</h2><p>View your profile or explore others.</p></div>;
  }

  return (
    <div className="grid" style={{gap:'1.25rem', maxWidth:680}}>
      <Progress value={(step+1)/steps.length} />
      <div className="card">
        {steps[step]}
        <div className="flex space-between" style={{marginTop:'1rem'}}>
          <button type="button" onClick={prev} disabled={step===0}>Back</button>
          {step < steps.length-1 && <button type="button" onClick={next}>Next</button>}
        </div>
      </div>
    </div>
  );
}

function FormRow({label, children}:{label:string; children:React.ReactNode}) {
  return <div className="form-row"><label>{label}</label>{children}</div>;
}

function Progress({value}:{value:number}) {
  return (
    <div style={{height:10, background:'#222a35', borderRadius:8, overflow:'hidden'}}>
      <div style={{height:'100%', width:`${Math.round(value*100)}%`, background:'linear-gradient(90deg,#ff4fa3,#ff9bd2)'}} />
    </div>
  );
}
