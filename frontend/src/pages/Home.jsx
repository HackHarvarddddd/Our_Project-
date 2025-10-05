import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import '../styles/Harmoni.css'

export default function Home(){
  const [me, setMe] = useState(null)
  const [matches, setMatches] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedMood, setSelectedMood] = useState(null)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try{
        const meRes = await api.get('/auth/me')
        setMe(meRes.data)
        // Load matches & schedules so Home and Matches are merged here
        const [mRes, schRes] = await Promise.all([
          api.get('/matches'),
          api.get('/schedule')
        ])
        setMatches(mRes.data.matches || [])
        setSchedules(schRes.data.schedules || [])
      }catch(e){
        // silently ignore if not logged in; user can still see hero
        console.error(e)
      }
    }
    load()
  },[])

  async function updateMood(mood) {
    setSelectedMood(mood)
  }

  function findHarmoni() {
    if (!selectedMood) {
      setError('Please select a mood before proceeding.')
      return
    }
    navigate(`/mood-room?mood=${encodeURIComponent(selectedMood)}`)
  }

  async function deleteInvite(id) {
    try {
      await api.delete(`/schedule/${id}`)
      setSchedules(schedules.filter(s => s.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  async function refreshSchedules() {
    try {
      const schRes = await api.get('/schedule')
      setSchedules(schRes.data.schedules || [])
    } catch (e) {
      console.error(e)
    }
  }

  function goToRoom(mood){
    navigate(`/mood-room?mood=${encodeURIComponent(mood)}`)
  }

  const profile = me?.profile || {}
  const name = me?.user?.name || ''
  const summary = profile?.summary || 'Your Harmoni personality will appear here after you finish the quiz.'

  return (
    <div className="harmoni-gradient full-bleed">
      <div className="home-wrap">
        <header className="home-header">
          <div>
            <h2 className="personality greet">Hi{name ? `, ${name}` : ''} 👋</h2>
            <p className="personality desc">{summary}</p>
          </div>
          <div className="home-nav">
            {!me?.user && <Link className="link" to="/login">Log in</Link>}
            {me?.user && <Link className="link" to="/quiz">Take/Update Quiz</Link>}
          </div>
        </header>

        <main className="home-main">
          {/* LEFT: quick preferences */}
          <section className="card">
            <h3>Pick a Color</h3>
            <div className="dots" role="list">
              <span className="dot dot-green" title="Green"></span>
              <span className="dot dot-navy" title="Navy"></span>
              <span className="dot dot-maroon" title="Maroon"></span>
              <span className="dot dot-black" title="Black"></span>
              <span className="dot dot-brown" title="Brown"></span>
              <span className="dot dot-orange" title="Orange"></span>
              <span className="dot dot-cocoa" title="Cocoa"></span>
              <span className="dot dot-pink" title="Pink"></span>
            </div>

            <h3 style={{marginTop:16}}>Pick Your Mood(s)</h3>
            <div className="chips">
              {['Calm', 'Restless', 'Nostalgic', 'Lonely', 'Excited', 'Powerful', 'Upset', 'Stressed', 'Positive', 'Other'].map(x => (
                <button
                  key={x}
                  className={`chip ${selectedMood === x ? 'selected' : ''}`}
                  type="button"
                  onClick={() => updateMood("Calm")} // Call updateMood on click
                >
                  {x}
                </button>
              ))}
            </div>
            {error && <p className="error" style={{ color: 'red' }}>{error}</p>} {/* Display error */}
            <button className="cta find" onClick={findHarmoni}>Find Your Harmoni</button>
          </section>

          {/* RIGHT: merged "Matches" & schedule widgets */}
          <section className="card" id="invites">
            <h3>Invites & Plans</h3>
            {schedules.length === 0 && (
              <p className="small">No invitations yet. When you schedule with a match, it’ll show up here.</p>
            )}
            {schedules.map(s => (
              <div key={s.id} className="row" style={{alignItems:'center'}}>
                <div className="col">
                  <div><strong>{s.partner?.name || s.partner_name || 'Unknown'}</strong></div> {/* Adjusted to show the actual name */}
                  <div className="small">{new Date(s.start_iso).toLocaleString()} – {new Date(s.end_iso).toLocaleString()}</div>
                </div>
                <div className="col">
                  <Link to={`/match/${s.partner?.id || s.partner_id}`}><button>Open</button></Link>
                  <button onClick={()=>deleteInvite(s.id)} style={{marginLeft:8}}>Delete</button>
                </div>
              </div>
            ))}
            {schedules.length > 0 && (
              <div style={{marginTop:8}}>
                <button onClick={refreshSchedules}>Refresh</button>
              </div>
            )}
          </section>

          <section className="card" id="matches">
            <h3>Top Matches</h3>
            {matches.length===0 && <p className="small">No matches yet. Invite friends to try the app and make sure they complete the quiz!</p>}
            {matches.map(m => (
              <div key={m.user_id} className="row" style={{alignItems:'center'}}>
                <div className="col">
                  <strong>{m.name}</strong>
                  <div className="small">{m.summary}</div>
                </div>
                <div className="col"><span className="score">Score: {(m.score*100).toFixed(0)}%</span></div>
                <div className="col">
                  <Link to={`/match/${m.user_id}`}><button>View &amp; Schedule</button></Link>
                </div>
              </div>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}

