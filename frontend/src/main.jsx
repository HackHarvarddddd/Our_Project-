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
import MatchedRoom from './pages/MatchedRoom.jsx'
import TestRoom from './pages/TestRoom.jsx'
import MoodRoom from './pages/MoodRoom.jsx'
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
        {/* Keep MatchDetail as a separate page */}
        <Route path="match/:id" element={<MatchDetail/>} />
        {/* Matched room for collaborative canvas */}
        <Route path="matched-room" element={<MatchedRoom/>} />
        {/* Test room for debugging */}
        <Route path="test-room" element={<TestRoom/>} />
        {/* Mood room for relaxation */}
        <Route path="mood-room" element={<MoodRoom/>} />
        {/* Redirect any legacy dashboard links to the merged Home page */}
        <Route path="dashboard" element={<Navigate to="/home" replace/>} />
      </Route>
    </Routes>
  </BrowserRouter>
)