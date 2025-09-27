import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { generateUsername } from '../utils/generateUsername';
import { validatePassword, hashPassword, storeCredentials, getStoredCredentials } from '../utils/password';
import { LOCATION_OPTIONS } from '../utils/locations';

interface FormState {
  firstName: string;
  lastName: string;
  areas: string[];
  goals: string;
  experienceLevel: string;
  bio: string;
  location: string;
  username: string;
  password: string;
  passwordConfirm: string;
}

const AREA_OPTIONS = ['Gaming', 'Esports', 'Game Dev', 'Tech Conventions', 'Sports Analytics', 'Sports Performance', 'VR/AR', 'Web Dev'];
const EXPERIENCE_LEVELS = ['Student', 'Early Career', 'Mid Career', 'Senior', 'Leader'];

export default function OnboardingPage() {
  const { user, setUser } = useUserStore() as { user: any; setUser: (user: any) => void };
  const [step, setStep] = useState(0);
  const existingCreds = getStoredCredentials();
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', areas: [], goals: '', experienceLevel: '', bio: '', location: '',
    username: '', password: '', passwordConfirm: ''
  });
  // Track the selection in the location dropdown separately so we can support a custom location.
  const [locationSelect, setLocationSelect] = useState('');
  const [pwdIssues, setPwdIssues] = useState<Array<string>>([]);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  
  // Validation helpers
  const stepValid = (current: number): boolean => {
    switch (current) {
      case 0: // Basic info
        return !!(form.firstName.trim() && form.lastName.trim() && form.location.trim());
      case 1: // Focus areas
        return form.areas.length > 0;
      case 2: // Experience & goals
        return !!(form.experienceLevel && form.goals.trim());
      case 3: // Bio
        return !!form.bio.trim();
      case 4: { // Credentials
        const unameOk = /^[a-zA-Z0-9_-]{3,24}$/.test(form.username.trim());
        const pwIssues = validatePassword(form.password);
        const mismatch = form.password !== form.passwordConfirm;
  return unameOk && !!form.password && !!form.passwordConfirm && pwIssues.length === 0 && !mismatch;
      }
      default:
        return false;
    }
  };

  function toggleArea(area: string) {
    setForm((f: FormState) => ({
      ...f,
      areas: f.areas.includes(area)
        ? f.areas.filter((a: string) => a !== area)
        : [...f.areas, area]
    }));
  }

  function next() { setStep((s: number) => Math.min(s + 1, steps.length - 1)); }
  function prev() { setStep((s: number) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    // Username required: must be 3-24 chars alphanumeric/ _ -
    const rawUsername = form.username.trim();
    const unameValid = /^[a-zA-Z0-9_-]{3,24}$/.test(rawUsername);
    if (!unameValid) {
      setUsernameError('Username must be 3-24 characters: letters, numbers, _ or -');
      return;
    } else {
      setUsernameError('');
    }
    const safeUsername = rawUsername.toLowerCase();

    // Password required and must meet rules
    const issues = validatePassword(form.password);
    const mismatch = form.password !== form.passwordConfirm ? ['Passwords do not match'] : [];
    const combined = [...issues, ...mismatch];
    setPwdIssues(combined);
    if (combined.length) return;

    const passwordHash = await hashPassword(form.password);
    storeCredentials({ username: safeUsername, passwordHash, createdAt: new Date().toISOString() });

    setUser({
      id: crypto.randomUUID(),
      username: safeUsername,
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
      <FormRow label="First Name">
        <input
          value={form.firstName}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f: FormState) => ({ ...f, firstName: e.target.value }))
          }
        />
      </FormRow>
      <FormRow label="Last Name">
        <input
          value={form.lastName}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f: FormState) => ({ ...f, lastName: e.target.value }))
          }
        />
      </FormRow>
      <FormRow label="Location">
        <div style={{display:'flex', flexDirection:'column', gap:'.5rem'}}>
          <select
            value={locationSelect}
            required
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              const val = e.target.value;
              setLocationSelect(val);
              if (val !== '__OTHER__') {
                setForm((f: FormState) => ({ ...f, location: val }));
              } else {
                // Reset custom location until user types
                setForm((f: FormState) => ({ ...f, location: '' }));
              }
            }}
          >
            <option value="">Select location...</option>
            {LOCATION_OPTIONS.map((loc: string) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
            <option value="__OTHER__">Other (not listed)</option>
          </select>
          {locationSelect === '__OTHER__' && (
            <input
              value={form.location}
              required
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((f: FormState) => ({ ...f, location: e.target.value }))
              }
              placeholder="Enter your city / region"
            />
          )}
        </div>
      </FormRow>
    </div>,
    <div key="s2">
      <h2>Focus Areas</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))'}}>
        {AREA_OPTIONS.map((opt: string) => {
          const active = form.areas.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggleArea(opt)}
              aria-pressed={active}
              aria-label={`${opt}${active ? ' selected' : ''}`}
              style={{
                background: active ? '#ff9bd2' : '#222a35',
                color: active ? '#181a1f' : '#d0d9e5'
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>,
    <div key="s3">
      <h2>Experience & Goals</h2>
      <FormRow label="Experience Level">
        <select
          value={form.experienceLevel}
          required
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setForm((f: FormState) => ({ ...f, experienceLevel: e.target.value }))
          }
        >
          <option value="">Select...</option>
          {EXPERIENCE_LEVELS.map((l: string) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </FormRow>
      <FormRow label="Goals">
        <textarea
          rows={4}
          value={form.goals}
          required
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setForm((f: FormState) => ({ ...f, goals: e.target.value }))
          }
          placeholder="What do you hope to achieve?"
        />
      </FormRow>
    </div>,
    <div key="s4">
      <h2>Bio</h2>
      <FormRow label="About You">
        <textarea
          rows={5}
          value={form.bio}
          required
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setForm((f: FormState) => ({ ...f, bio: e.target.value }))
          }
          placeholder="Share your journey, wins, and what you want to learn."
        />
      </FormRow>
    </div>,
    <div key="s5">
      <h2>Account Credentials</h2>
      <FormRow label="Username *">
        <input
          value={form.username}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUsernameTouched(true);
            setForm((f: FormState) => ({ ...f, username: e.target.value }));
          }}
          placeholder="yourhandle"
        />
      </FormRow>
      {(usernameError || (usernameTouched && !form.username)) && (
        <p style={{color:'#ff9bd2', fontSize:'.7rem', marginTop:'-.5rem'}}>{usernameError || 'Username is required.'}</p>
      )}
      <FormRow label="Password *">
        <input
          type="password"
          value={form.password}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setForm((f: FormState) => ({ ...f, password: val }));
            setPwdIssues(validatePassword(val));
          }}
          placeholder="Strong password"
          autoComplete="new-password"
        />
      </FormRow>
      <FormRow label="Confirm Password *">
        <input
          type="password"
          value={form.passwordConfirm}
          required
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const val = e.target.value;
            setForm((f: FormState) => ({ ...f, passwordConfirm: val }));
            if (form.password) {
              setPwdIssues((prev: string[]) => prev.filter((p: string) => p !== 'Passwords do not match'));
              if (val !== form.password) setPwdIssues((prev: string[]) => [...prev.filter((p: string) => p !== 'Passwords do not match'), 'Passwords do not match']);
            }
          }}
          placeholder="Re-enter password"
          autoComplete="new-password"
        />
      </FormRow>
      {pwdIssues.length > 0 && (
        <ul style={{marginTop:'.5rem', paddingLeft:'1.1rem', color:'#ff9bd2', fontSize:'.7rem'}}>
          {pwdIssues.map((i: string) => <li key={i}>{i}</li>)}
        </ul>
      )}
      <button
        onClick={handleSubmit}
        disabled={!(stepValid(0) && stepValid(1) && stepValid(2) && stepValid(3) && stepValid(4))}
      >Finish & Create Profile</button>
      <p style={{opacity:.6, fontSize:'.65rem', marginTop:'.75rem'}}>Credentials stored locally (prototype). Do not use a real password.</p>
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
          {step < steps.length-1 && (
            <button type="button" onClick={next} disabled={!stepValid(step)}>Next</button>
          )}
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
