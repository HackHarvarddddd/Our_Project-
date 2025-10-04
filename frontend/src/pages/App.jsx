import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  return (
    <>
      <nav className="glass-nav">
        <div className="brand"><Link to="/onboarding">Harmoni</Link></div>
        <div className="nav-links">
          {token ? (
            <>
              <Link to="/quiz">Quiz</Link>
              <Link to="/home">Home</Link>
              <a href="#" onClick={e=>{e.preventDefault();logout();}}>Logout</a>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Link to="/room">Room</Link>
            </>
          )}
        </div>
      </nav>
      <div className="container">
        <Outlet/>
      </div>
    </>
  )
}
