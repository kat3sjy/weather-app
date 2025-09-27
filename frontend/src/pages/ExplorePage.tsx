export default function ExplorePage() {
  // Placeholder suggested users / events
  const sample = [
    { name: 'Aisha', focus: 'Esports Shoutcasting', location: 'Remote' },
    { name: 'Naomi', focus: 'VR Dev @ Hackathons', location: 'Seattle' },
    { name: 'Priya', focus: 'Basketball Analytics', location: 'Toronto' }
  ];
  return (
    <div className="grid" style={{gap:'1rem'}}>
      <h2>Explore Members & Events</h2>
      <div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))'}}>
        {sample.map(s => (
          <div key={s.name} className="card">
            <h3>{s.name}</h3>
            <div className="tag">{s.focus}</div>
            <p style={{opacity:.7, fontSize:'.8rem', marginTop:'.5rem'}}>{s.location}</p>
            <button style={{marginTop:'.75rem', width:'100%'}}>Connect</button>
          </div>
        ))}
      </div>
    </div>
  );
}
