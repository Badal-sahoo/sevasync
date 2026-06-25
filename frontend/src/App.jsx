import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './features/auth/Login';
import NgoDashboard from './features/ngo/NgoDashboard';
import VolunteerDashboard from './features/volunteer/VolunteerDashboard';
import TaskDetail from './features/tasks/TaskDetail';
import VolunteerTaskDetail from './features/volunteer/VolunteerTaskDetail';

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