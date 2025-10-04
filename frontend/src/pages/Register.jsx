import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/register', { name, email, password })
      localStorage.setItem('token', data.token)
      navigate('/quiz')
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="card">
      <h2>Create account</h2>
      <form onSubmit={onSubmit} className="row">
        <div className="col"><input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="col"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="col"><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
        <div className="col"><button>Sign up</button></div>
      </form>
      {error && <p className="small" style={{color:'#ffb4c4'}}>{error}</p>}
      <p className="small">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  )
}
