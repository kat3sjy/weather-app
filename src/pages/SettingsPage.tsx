import React, { useState } from 'react';
import { useUserStore } from '../store/userStore';
import { handleImageUpload, validateImageFile } from '../utils/imageUpload';

export default function SettingsPage() {
  const { user, setUser, logout } = useUserStore() as any;
  const [imageError, setImageError] = useState('');
  
  if (!user) return <div className="card"><p>Login / onboard first.</p></div>;

  function update(field: string, value: string) {
    setUser({...user, [field]: value});
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      setImageError(validation);
      return;
    }

    try {
      setImageError('');
      const dataUrl = await handleImageUpload(file);
      setUser({...user, avatarUrl: dataUrl});
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }

  return (
    <div className="grid" style={{gap:'1rem', maxWidth:600}}>
      <h2>Settings</h2>
      <div className="card">
        <div className="form-row">
          <label>Profile Picture</label>
          <div style={{display:'flex', flexDirection:'column', gap:'.75rem'}}>
            {user.avatarUrl && (
              <div style={{display:'flex', alignItems:'center', gap:'.75rem'}}>
                <img 
                  src={user.avatarUrl} 
                  alt="Current profile" 
                  style={{width:'80px', height:'80px', borderRadius:'50%', objectFit:'cover'}}
                />
                <button 
                  type="button" 
                  onClick={() => setUser({...user, avatarUrl: undefined})}
                  style={{fontSize:'.7rem', padding:'.25rem .5rem'}}
                >
                  Remove Picture
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{padding:'.5rem'}}
            />
            {imageError && (
              <p style={{color:'#ff9bd2', fontSize:'.7rem', margin:0}}>{imageError}</p>
            )}
            <p style={{fontSize:'.65rem', opacity:0.7, margin:0}}>
              Accepted formats: JPG, PNG, GIF. Max size: 5MB
            </p>
          </div>
        </div>
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
