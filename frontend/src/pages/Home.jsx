import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import '../styles/Harmoni.css'

export default function Home(){
  const [me, setMe] = useState(null)
  const navigate = useNavigate()

  useEffect(()=>{
    async function load(){
      try{
        const meRes = await api.get('/auth/me')
        setMe(meRes.data)
      }catch(e){
        // not logged in
      }
    }
    load()
  },[])

  const profile = me?.profile || {}
  const name = me?.user?.name || ''
  const summary = profile?.summary || 'Your Harmoni personality will appear here after you finish the quiz.'
  
  function findHarmoni(){
    navigate('/dashboard')
  }

  return (
    <div className="harmoni-gradient full-bleed">
      <div className="home-wrap">
        <header className="home-header">
          <nav className="home-nav">
            <Link to="/dashboard" className="link">Find artists around</Link>
            <Link to="/quiz" className="link">My Profile</Link>
          </nav>
        </header>

        <main className="home-main">
          <div className="personality">
            <h2 className="greet">{name ? `${name},` : ''}</h2>
            <p className="desc">{summary}</p>
          </div>

          <section className="mood">
            <h3>How are you feeling at the moment?</h3>
            <div className="dots">
              <span className="dot dot-green" />
              <span className="dot dot-navy" />
              <span className="dot dot-maroon" />
              <span className="dot dot-black" />
              <span className="dot dot-brown" />
              <span className="dot dot-orange" />
              <span className="dot dot-cocoa" />
              <span className="dot dot-pink" />
            </div>
            <h3 style={{marginTop:16}}>Pick Your Mood(s)</h3>
            <div className="chips">
              {['Calm','Restless','Nostalgic','Lonely','Excited','Powerful','Upset','Stressed','Positive','Other'].map(x=>(
                <button key={x} className="chip" type="button">{x}</button>
              ))}
            </div>

            <button className="cta find" onClick={findHarmoni}>Find Your Harmoni</button>
          </section>
        </main>
      </div>
    </div>
  )
}
