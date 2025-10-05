import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './pages/App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Quiz from './pages/Quiz.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Home from './pages/Home.jsx'
import Room from './pages/Room.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}>
        <Route index element={<Navigate to="/onboarding" replace/>} />
        <Route path="login" element={<Login/>} />
        <Route path="onboarding" element={<Onboarding/>} />
        <Route path="home" element={<Home/>} />
        <Route path="register" element={<Register/>} />
        <Route path="quiz" element={<Quiz/>} />
        <Route path="room" element={<Room />} />
        {/* Keep MatchDetail as a separate page */}
        <Route path="match/:id" element={<MatchDetail/>} />
        {/* Redirect any legacy dashboard links to the merged Home page */}
        <Route path="dashboard" element={<Navigate to="/home" replace/>} />
      </Route>
    </Routes>
  </BrowserRouter>
)
