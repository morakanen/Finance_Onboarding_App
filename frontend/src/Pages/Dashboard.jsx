// src/pages/Dashboard.jsx
import React from 'react';
import useAuthStore from '../store/AuthStore';

function Dashboard() {
  const { user, role, logout } = useAuthStore();

  if (!user) {
    return <p>You need to be logged in to view this page.</p>;
  }

  return (
    <div>
      <h1>Welcome {user.email} </h1>
      <p>Client Dashboard</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Dashboard;