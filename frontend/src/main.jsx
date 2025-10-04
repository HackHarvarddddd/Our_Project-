import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './pages/App.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Quiz from './pages/Quiz.jsx'
import Dashboard from './pages/Dashboard.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App/>}>
        <Route index element={<Navigate to="/dashboard" replace/>} />
        <Route path="login" element={<Login/>} />
        <Route path="register" element={<Register/>} />
        <Route path="quiz" element={<Quiz/>} />
        <Route path="dashboard" element={<Dashboard/>} />
        <Route path="match/:id" element={<MatchDetail/>} />
      </Route>
    </Routes>
  </BrowserRouter>
)
