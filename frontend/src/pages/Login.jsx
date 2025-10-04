import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'
import '../styles/Login.css'


export default function Login() {
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [error, setError] = useState('')
const navigate = useNavigate()


async function onSubmit(e) {
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
  <div className="page">
    <div className="card">
      <h2 className="title">Log in</h2>
      <form onSubmit={onSubmit} className="form">
        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button className="button">Log in</button>
      </form>
      {error && <p className="helperText" style={{ color: '#ffb4c4' }}>{error}</p>}
      <p className="helperText">
        No account? <Link to="/register">Register</Link>
      </p>
    </div>
  </div>
)
}
