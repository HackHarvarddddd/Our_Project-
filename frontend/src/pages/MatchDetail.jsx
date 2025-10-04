import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function MatchDetail(){
  const { id } = useParams()
  const navigate = useNavigate()
  const [partner, setPartner] = useState(null)
  const [result, setResult] = useState(null)

  useEffect(()=>{
    async function load(){
      // Find this partner in the matches list to show name/summary
      try {
        const m = await api.get('/matches')
        const pt = (m.data.matches || []).find(x=>String(x.user_id)===String(id))
        setPartner(pt || { user_id: id, name: 'Artist', summary: '' })
      } catch (_) {
        setPartner({ user_id: id, name: 'Artist', summary: '' })
      }

      // If a schedule already exists between the two users, show it
      try {
        const existing = await api.get(`/schedule/with/${id}`)
        if (existing.data?.scheduled) {
          setResult(existing.data)
        }
      } catch (e) {
        // ignore
      }
    }
    load()
  },[id])

  async function schedule(){
    const { data } = await api.post('/schedule', { partnerUserId: id })
    setResult(data)
  }

  async function openCanvas(){
    try {
      // Create or get canvas room for this match
      const { data } = await api.post('/canvas/room', { partnerUserId: id })
      navigate(`/canvas/${data.roomId}`)
    } catch (error) {
      console.error('Failed to create canvas room:', error)
    }
  }

  return (
    <div className="card">
      <h2>Match Detail</h2>
      {partner && (<>
        <p><strong>{partner.name}</strong></p>
        <p className="small">{partner.summary}</p>
        <button onClick={schedule}>Auto-Schedule Outing</button>
      </>)}
      {result?.scheduled === null && <p className="small" style={{marginTop:12}}>No overlapping availability found. Try editing your quiz availability.</p>}
      {result?.scheduled && (
        <div style={{marginTop:12}}>
          <p><strong>Scheduled:</strong> {new Date(result.scheduled.start_iso).toLocaleString()} to {new Date(result.scheduled.end_iso).toLocaleString()}</p>
          <p className="small">{result.scheduled.event.title} • {result.scheduled.event.location}</p>
          <button onClick={openCanvas} className="canvas-btn" style={{marginTop: 12}}>
            🎨 Open Shared Canvas
          </button>
        </div>
      )}
    </div>
  )
}
