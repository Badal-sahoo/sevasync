import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import NgoDashboard from './pages/NgoDashboard'; 
import VolunteerDashboard from './pages/VolunteerDashboard';
import TaskDetail from "./pages/TaskDetail";
import VolunteerTaskDetail from "./pages/VolunteerTaskDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ngo-dashboard" element={<NgoDashboard />} />
        <Route path="/volunteer-dashboard" element={<VolunteerDashboard />} />
        <Route path="/volunteer/task/:taskId" element={<VolunteerTaskDetail />} />
        <Route path="/task/:id" element={<TaskDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;