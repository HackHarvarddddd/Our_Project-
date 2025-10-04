import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function onSubmit(e){
    e.preventDefault()
    setError('')
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      navigate('/dashboard')
    } catch (e) {
      setError(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="card">
      <h2>Log in</h2>
      <form onSubmit={onSubmit} className="row">
        <div className="col"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/></div>
        <div className="col"><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)}/></div>
        <div className="col"><button>Log in</button></div>
      </form>
      {error && <p className="small" style={{color:'#ffb4c4'}}>{error}</p>}
      <p className="small">No account? <Link to="/register">Register</Link></p>
    </div>
  )
}
