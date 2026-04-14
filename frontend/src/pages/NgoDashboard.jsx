import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../services/auth';

const NgoDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser(); // Tell Firebase to clear the session
      navigate('/');      // Teleport the user back to the Login page
    } catch (error) {
      alert("Failed to log out");
    }
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>NGO Dashboard</h2>
        <button 
          onClick={handleLogout} 
          style={{ padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Welcome to the NGO Portal</h3>
        <p>Your MVP data upload tools will go here soon!</p>
      </div>
    </div>
  );
};

export default NgoDashboard;