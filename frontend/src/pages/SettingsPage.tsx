import { useUserStore } from '../store/userStore';

export default function SettingsPage() {
  const { user, setUser, logout } = useUserStore() as any;
  if (!user) return <div className="card"><p>Login / onboard first.</p></div>;

  function update(field: string, value: string) {
    setUser({...user, [field]: value});
  }

  return (
    <div className="grid" style={{gap:'1rem', maxWidth:600}}>
      <h2>Settings</h2>
      <div className="card">
        <div className="form-row">
          <label>First Name</label>
          <input value={user.firstName} onChange={e=>update('firstName', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Last Name</label>
          <input value={user.lastName} onChange={e=>update('lastName', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Location</label>
          <input value={user.location} onChange={e=>update('location', e.target.value)} />
        </div>
        <div className="form-row">
          <label>Bio</label>
          <textarea rows={4} value={user.bio} onChange={e=>update('bio', e.target.value)} />
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', marginTop:'1rem'}}>
          <button type="button" style={{background:'#222a35', color:'#fff'}} onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}
