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
  
  // Basic validation
  if (!email || !password) {
    setError('Please fill in all fields')
    return
  }
  
  try {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', res.data.token)
    navigate('/onboarding')  // <— go to Figma onboarding
  } catch (err) {
    console.error('Login error:', err)
    const errorMessage = err?.response?.data?.error || 'Login failed'
    setError(errorMessage)
  }
}

return (
  <div className="authPage">
    <div className="authCard">
      <h2>Log in</h2>
      <form onSubmit={onSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
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
