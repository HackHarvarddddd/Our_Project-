import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard(){
  const [me, setMe] = useState(null)
  const [matches, setMatches] = useState([])
  const [schedules, setSchedules] = useState([])
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try {
        const meRes = await api.get('/auth/me')
        setMe(meRes.data)

        const [mRes, schRes] = await Promise.all([
          api.get('/matches'),
          api.get('/schedule')
        ])
        setMatches(mRes.data.matches || [])
        setSchedules(schRes.data.schedules || [])
      } catch (e) {
        console.error(e)
      }
    }
    load()
  },[])

  async function deleteInvite(id) {
    try {
      await api.delete(`/schedule/${id}`);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  }

  async function refreshSchedules() {
    try {
      const schRes = await api.get('/schedule');
      setSchedules(schRes.data.schedules || []);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    refreshSchedules();
  }, []);

  if (!me) return null

  return (
    <>
      <div className="card">
        <h2>Welcome, {me.user?.name}</h2>
        <p className="small">Your profile summary will update after you take the quiz.</p>
        {me.profile?.traits && (
          <p><strong>Your AI-style summary:</strong> {me.profile?.summary}</p>
        )}
        {me.profile?.traits && (
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
            {Object.entries(JSON.parse(me.profile.traits)).map(([k,v])=>(
              <span key={k} className="chip">{k}: {Number(v).toFixed(2)}</span>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Invites & Plans</h3>
        {schedules.length === 0 && (
          <p className="small">No invites yet. When you or a match schedules an outing, it will appear here for <em>both</em> of you.</p>
        )}
        {schedules.map(s => (
          <div key={s.id} className="row" style={{alignItems:'center'}}>
            <div className="col">
              <strong>{s.partner.name}</strong>
              <div className="small">{s.event.title} • {new Date(s.start_iso).toLocaleString()}</div>
            </div>
            <div className="col">{s.sentByMe ? <span className="chip">You invited</span> : <span className="chip">Invited you</span>}</div>
            <div className="col">
              <Link to={`/match/${s.partner.id}`}><button>Open</button></Link>
              <button onClick={() => deleteInvite(s.id)} style={{ marginLeft: 8 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Top Matches</h3>
        {matches.length===0 && <p className="small">No matches yet. Share the app with friends and make sure they complete the quiz!</p>}
        {matches.map(m => (
          <div key={m.user_id} className="row" style={{alignItems:'center'}}>
            <div className="col"><strong>{m.name}</strong><div className="small">{m.summary}</div></div>
            <div className="col"><span className="score">Score: {(m.score*100).toFixed(0)}%</span></div>
            <div className="col"><Link to={`/match/${m.user_id}`}><button>View & Schedule</button></Link></div>
          </div>
        ))}
      </div>
    </>
  )
}
