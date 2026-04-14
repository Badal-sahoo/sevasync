import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import NgoDashboard from './pages/NgoDashboard'; 
import VolunteerDashboard from './pages/VolunteerDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ngo-dashboard" element={<NgoDashboard />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;