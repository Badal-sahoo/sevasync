import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/auth';

const VolunteerDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); 
      navigate('/');      
    } catch (error) {
      alert("Failed to log out");
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Volunteer Dashboard</h2>
        <button 
          onClick={handleLogout} 
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Welcome, Volunteer!</h3>
        <p>Your assigned tasks will appear here soon.</p>
      </div>
    </div>
  );
};

export default VolunteerDashboard;