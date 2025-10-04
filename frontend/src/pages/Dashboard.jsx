import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Dashboard(){
  const [me, setMe] = useState(null)
  const [matches, setMatches] = useState([])
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try {
        const meRes = await api.get('/auth/me')
        setMe(meRes.data)
        const mRes = await api.get('/matches')
        setMatches(mRes.data.matches)
      } catch (e) {
        navigate('/login')
      }
    }
    load()
  }, [])

  return (
    <>
      <div className="card">
        <h2>Welcome{me?.user ? `, ${me.user.name}` : ''}</h2>
        <p className="small">Your profile summary will update after you take the quiz.</p>
        {me?.profile && (
          <div>
            <p><strong>Your AI-style summary:</strong> {me.profile.summary}</p>
            <div>{Object.entries(JSON.parse(me.profile.traits||'{}')).map(([k,v])=>(
              <span key={k} className="badge">{k}: {v.toFixed(2)}</span>
            ))}</div>
          </div>
        )}
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
