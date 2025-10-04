import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api'

export default function MatchDetail(){
  const { id } = useParams()
  const [partner, setPartner] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(()=>{
    async function load(){
      const me = await api.get('/auth/me')
      // Find this partner in the matches list to show name/summary
      const m = await api.get('/matches')
      const pt = m.data.matches.find(x=>x.user_id===id)
      setPartner(pt || { user_id: id, name: 'Artist', summary: '' })
    }
    load()
  }, [id])

  async function schedule(){
    const { data } = await api.post('/schedule', { partnerUserId: id })
    setResult(data)
  }

  return (
    <div className="card">
      <h2>Match Detail</h2>
      {partner && (<>
        <p><strong>{partner.name}</strong></p>
        <p className="small">{partner.summary}</p>
        <button onClick={schedule}>Auto‑Schedule Outing</button>
      </>)}
      {result?.scheduled === null && <p className="small" style={{marginTop:8}}>No overlapping availability found. Try editing your quiz availability.</p>}
      {result?.scheduled && (
        <div style={{marginTop:12}}>
          <p><strong>Scheduled:</strong> {result.scheduled.event.title} — {new Date(result.scheduled.start_iso).toLocaleString()} to {new Date(result.scheduled.end_iso).toLocaleString()}</p>
          <p className="small">{result.scheduled.event.location}</p>
        </div>
      )}
    </div>
  )
}
