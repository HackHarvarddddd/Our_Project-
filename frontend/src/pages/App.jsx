import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const logout = () => { localStorage.removeItem('token'); navigate('/login'); };

  return (
    <>
      <nav>
        <div className="brand"><Link to="/dashboard">🎨 ArtLink</Link></div>
        <div className="nav-links">
          {token ? (<>
            <Link to="/quiz">Quiz</Link>
            <Link to="/dashboard">Dashboard</Link>
            <a href="#" onClick={e=>{e.preventDefault();logout();}}>Logout</a>
          </>) : (<>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>)}
        </div>
      </nav>
      <div className="container">
        <Outlet/>
      </div>
    </>
  )
}
