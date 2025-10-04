import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Harmoni.css'

export default function Onboarding(){
  const navigate = useNavigate()
  const go = () => navigate('/home')

  return (
    <div className="harmoni-gradient full-bleed">
      <div className="center-stack">
        <h1 className="title">Harmoni</h1>
        <p className="subtitle">where mood meets melodies</p>
        <button className="cta" onClick={go}>Click to start your journey</button>
      </div>
    </div>
  )
}
